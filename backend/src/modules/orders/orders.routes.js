const express = require("express");
const { query, withTransaction } = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const { ApiError } = require("../../utils/ApiError");
const { generateTicketCode } = require("../../utils/ticketCodeGenerator");
const { getOrderWithTickets } = require("../tickets/tickets.service");
const { getGateway } = require("../payments/gateways");
const { env } = require("../../config/env");

const router = express.Router();

/**
 * POST /api/orders   (public / guest checkout)
 * Body: {
 *   event_id, buyer_name, buyer_email, buyer_phone,
 *   items: [{ ticket_type_id, quantity, holder_name? }]
 * }
 *
 * Reserves stock atomically with SELECT ... FOR UPDATE row locks so concurrent
 * buyers can never exceed quantity_total. Creates the order (pending) and its
 * tickets (unpaid). Tickets become 'valid' only after payment success.
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { event_id, buyer_name, buyer_email, buyer_phone, items } = req.body || {};
    if (!event_id || !buyer_name || !buyer_email || !buyer_phone) {
      throw new ApiError(400, "event_id, buyer_name, buyer_email, buyer_phone are required");
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "items must be a non-empty array");
    }

    const result = await withTransaction(async (client) => {
      // Validate event + sales window
      const evRes = await client.query(`SELECT * FROM events WHERE id = $1`, [event_id]);
      if (!evRes.rows.length) throw new ApiError(404, "Event not found");
      const event = evRes.rows[0];
      if (event.status !== "published") {
        throw new ApiError(409, "Event is not on sale");
      }
      const now = new Date();
      if (now < new Date(event.sales_start) || now > new Date(event.sales_end)) {
        throw new ApiError(409, "Sales window is closed for this event");
      }

      let total = 0;
      const ticketRows = [];

      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        if (!item.ticket_type_id || !qty || qty <= 0) {
          throw new ApiError(400, "Each item needs ticket_type_id and positive quantity");
        }

        // Lock the ticket type row to serialize concurrent decrements.
        const ttRes = await client.query(
          `SELECT * FROM ticket_types
           WHERE id = $1 AND event_id = $2 FOR UPDATE`,
          [item.ticket_type_id, event_id]
        );
        if (!ttRes.rows.length) throw new ApiError(404, "Ticket type not found for this event");
        const tt = ttRes.rows[0];

        if (!tt.is_active) throw new ApiError(409, `${tt.name} is not on sale`);
        if (qty > tt.max_per_order) {
          throw new ApiError(400, `${tt.name}: max ${tt.max_per_order} per order`);
        }

        // Per-ticket-type sales window override
        const wStart = tt.sales_start ? new Date(tt.sales_start) : new Date(event.sales_start);
        const wEnd = tt.sales_end ? new Date(tt.sales_end) : new Date(event.sales_end);
        if (now < wStart || now > wEnd) {
          throw new ApiError(409, `${tt.name} is not currently on sale`);
        }

        const remaining = tt.quantity_total - tt.quantity_sold;
        if (qty > remaining) {
          throw new ApiError(409, `${tt.name}: only ${remaining} left`);
        }

        // Reserve stock (safe because the row is locked)
        await client.query(
          `UPDATE ticket_types SET quantity_sold = quantity_sold + $1 WHERE id = $2`,
          [qty, tt.id]
        );

        total += Number(tt.price_etb) * qty;
        for (let n = 0; n < qty; n++) {
          ticketRows.push({
            ticket_type_id: tt.id,
            holder_name: item.holder_name || buyer_name,
          });
        }
      }

      // Create order
      const orderRes = await client.query(
        `INSERT INTO orders (event_id, buyer_name, buyer_email, buyer_phone, total_amount_etb, status)
         VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
        [event_id, buyer_name, buyer_email.toLowerCase(), buyer_phone, total.toFixed(2)]
      );
      const order = orderRes.rows[0];

      // Create tickets (unpaid). Unique codes with a retry on collision.
      for (const t of ticketRows) {
        let inserted = false;
        for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
          try {
            await client.query(
              `INSERT INTO tickets (order_id, ticket_type_id, event_id, ticket_code, holder_name, status)
               VALUES ($1,$2,$3,$4,$5,'unpaid')`,
              [order.id, t.ticket_type_id, event_id, generateTicketCode(), t.holder_name]
            );
            inserted = true;
          } catch (err) {
            if (err.code !== "23505") throw err; // not a unique violation
          }
        }
        if (!inserted) throw new ApiError(500, "Could not allocate unique ticket code");
      }

      return order;
    });

    const full = await getOrderWithTickets(result.id);
    res.status(201).json(full);
  })
);

// GET /api/orders/:id   (buyer looks up their order + tickets)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const full = await getOrderWithTickets(req.params.id);
    if (!full) throw new ApiError(404, "Order not found");
    res.json(full);
  })
);

/**
 * POST /api/orders/:id/pay
 * Body: { gateway: 'chapa' | 'telebirr' | 'cbe_birr' }
 * Creates a payment record and returns the gateway checkout_url.
 */
router.post(
  "/:id/pay",
  asyncHandler(async (req, res) => {
    const gatewayName = (req.body && req.body.gateway) || "chapa";
    const gateway = getGateway(gatewayName);

    const orderRes = await query(`SELECT * FROM orders WHERE id = $1`, [req.params.id]);
    if (!orderRes.rows.length) throw new ApiError(404, "Order not found");
    const order = orderRes.rows[0];
    if (order.status === "paid") throw new ApiError(409, "Order already paid");
    if (order.status !== "pending") throw new ApiError(409, `Order is ${order.status}`);

    // Create payment record (initiated)
    const payRes = await query(
      `INSERT INTO payments (order_id, gateway, amount_etb, status)
       VALUES ($1,$2,$3,'initiated') RETURNING *`,
      [order.id, gatewayName, order.total_amount_etb]
    );
    const payment = payRes.rows[0];

    const callbackUrl = `${env.APP_BASE_URL}/api/payments/webhook/${gatewayName}`;
    const returnUrl = `${env.APP_BASE_URL}/order.html?id=${order.id}`;

    const init = await gateway.initiate({ order, payment, callbackUrl, returnUrl });

    await query(
      `UPDATE payments SET gateway_ref = $1, raw_response = $2, updated_at = now() WHERE id = $3`,
      [init.gateway_ref, init.raw || null, payment.id]
    );

    res.json({
      payment_id: payment.id,
      gateway: gatewayName,
      gateway_ref: init.gateway_ref,
      checkout_url: init.checkout_url,
      simulated: typeof gateway.isLive === "function" ? !gateway.isLive() : false,
    });
  })
);

module.exports = router;
