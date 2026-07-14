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

/**
 * POST /api/orders/lookup  (public — recover lost tickets)
 * Body one of:
 *   { order_id }
 *   { ticket_code }
 *   { email, phone }
 */
router.post(
  "/lookup",
  asyncHandler(async (req, res) => {
    const orderId = String((req.body && req.body.order_id) || "").trim();
    const ticketCode = String((req.body && req.body.ticket_code) || "").trim();
    const email = String((req.body && req.body.email) || "")
      .trim()
      .toLowerCase();
    const phone = String((req.body && req.body.phone) || "")
      .trim()
      .replace(/\s+/g, "");

    let orderIds = [];

    if (orderId) {
      // Accept full UUID or short 8-char prefix from the ticket slip
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
        orderIds = [orderId];
      } else if (/^[0-9a-f]{8}$/i.test(orderId)) {
        const { rows } = await query(
          `SELECT id FROM orders WHERE id::text ILIKE $1 ORDER BY created_at DESC LIMIT 5`,
          [`${orderId}%`]
        );
        orderIds = rows.map((r) => r.id);
      } else {
        throw new ApiError(400, "Invalid order ID");
      }
    } else if (ticketCode) {
      const { rows } = await query(
        `SELECT order_id FROM tickets WHERE ticket_code = $1`,
        [ticketCode]
      );
      if (!rows.length) throw new ApiError(404, "No ticket found for that code");
      orderIds = [rows[0].order_id];
    } else if (email && phone) {
      const { rows } = await query(
        `SELECT id FROM orders
         WHERE buyer_email = $1
           AND REPLACE(buyer_phone, ' ', '') = $2
         ORDER BY created_at DESC
         LIMIT 10`,
        [email, phone]
      );
      if (!rows.length) {
        throw new ApiError(404, "No orders found for that email and phone");
      }
      orderIds = rows.map((r) => r.id);
    } else {
      throw new ApiError(
        400,
        "Provide order_id, ticket_code, or both email and phone"
      );
    }

    const orders = [];
    for (const id of orderIds) {
      const full = await getOrderWithTickets(id);
      if (!full) continue;
      const eventRes = await query(
        `SELECT id, title, venue, city, event_start, event_end, cover_image_url
         FROM events WHERE id = $1`,
        [full.order.event_id]
      );
      orders.push({
        ...full,
        event: eventRes.rows[0] || null,
      });
    }

    if (!orders.length) throw new ApiError(404, "No orders found");

    res.json({ orders });
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

function paymentInstructions(gatewayName, amount) {
  const amt = Number(amount).toFixed(2);
  if (gatewayName === "telebirr") {
    return {
      title: "Pay with Telebirr",
      steps: [
        `Open Telebirr on your phone`,
        `Send Br ${amt} to ${env.TELEBIRR_MERCHANT_PHONE}`,
        `Copy the transaction / confirmation code from Telebirr`,
        `Paste the codes below so we can verify your payment`,
      ],
      pay_to: env.TELEBIRR_MERCHANT_PHONE,
      amount_etb: amt,
    };
  }
  if (gatewayName === "cbe_birr") {
    return {
      title: "Pay with CBE Birr",
      steps: [
        `Open CBE Birr on your phone`,
        `Transfer Br ${amt} to account ${env.CBE_ACCOUNT_NUMBER} (${env.CBE_ACCOUNT_NAME})`,
        `Copy the reference / transaction number`,
        `Paste the codes below so we can verify your payment`,
      ],
      pay_to: env.CBE_ACCOUNT_NUMBER,
      pay_to_name: env.CBE_ACCOUNT_NAME,
      amount_etb: amt,
    };
  }
  // chapa (and default)
  return {
    title: "Pay with Chapa",
    steps: [
      `Pay Br ${amt} via Chapa`,
      env.CHAPA_MERCHANT_HINT,
      `After payment, copy your transaction code and reference`,
      `Paste the codes below so we can verify your payment`,
    ],
    amount_etb: amt,
  };
}

/**
 * POST /api/orders/:id/pay
 * Body: { gateway: 'chapa' | 'telebirr' | 'cbe_birr' }
 * Starts a manual payment: creates payment row + returns pay-on-phone instructions.
 * Buyer then submits tx/reference codes; admin approves before tickets unlock.
 */
router.post(
  "/:id/pay",
  asyncHandler(async (req, res) => {
    const gatewayName = (req.body && req.body.gateway) || "chapa";
    getGateway(gatewayName); // validate known gateway

    const orderRes = await query(`SELECT * FROM orders WHERE id = $1`, [req.params.id]);
    if (!orderRes.rows.length) throw new ApiError(404, "Order not found");
    const order = orderRes.rows[0];
    if (order.status === "paid") throw new ApiError(409, "Order already paid");
    if (order.status !== "pending") throw new ApiError(409, `Order is ${order.status}`);

    // Reuse an open payment on this order if still in progress
    const existing = await query(
      `SELECT * FROM payments
       WHERE order_id = $1 AND status IN ('initiated', 'awaiting_approval')
       ORDER BY created_at DESC LIMIT 1`,
      [order.id]
    );

    let payment;
    if (existing.rows.length) {
      payment = existing.rows[0];
      if (payment.gateway !== gatewayName && payment.status === "initiated") {
        const updated = await query(
          `UPDATE payments SET gateway = $1, updated_at = now() WHERE id = $2 RETURNING *`,
          [gatewayName, payment.id]
        );
        payment = updated.rows[0];
      }
    } else {
      const payRes = await query(
        `INSERT INTO payments (order_id, gateway, amount_etb, status)
         VALUES ($1,$2,$3,'initiated') RETURNING *`,
        [order.id, gatewayName, order.total_amount_etb]
      );
      payment = payRes.rows[0];
    }

    res.json({
      payment_id: payment.id,
      gateway: payment.gateway,
      status: payment.status,
      amount_etb: order.total_amount_etb,
      instructions: paymentInstructions(payment.gateway, order.total_amount_etb),
      mode: "manual_approval",
    });
  })
);

/**
 * POST /api/orders/:id/payment-proof
 * Body: { tx_code, reference_code, gateway? }
 * Buyer submits phone payment codes for admin review.
 */
router.post(
  "/:id/payment-proof",
  asyncHandler(async (req, res) => {
    const txCode = String((req.body && req.body.tx_code) || "").trim();
    const referenceCode = String((req.body && req.body.reference_code) || "").trim();
    const gatewayName = (req.body && req.body.gateway) || null;

    if (!txCode || !referenceCode) {
      throw new ApiError(400, "tx_code and reference_code are required");
    }

    const orderRes = await query(`SELECT * FROM orders WHERE id = $1`, [req.params.id]);
    if (!orderRes.rows.length) throw new ApiError(404, "Order not found");
    const order = orderRes.rows[0];
    if (order.status === "paid") throw new ApiError(409, "Order already paid");
    if (order.status !== "pending") throw new ApiError(409, `Order is ${order.status}`);

    let payment;
    const open = await query(
      `SELECT * FROM payments
       WHERE order_id = $1 AND status IN ('initiated', 'awaiting_approval')
       ORDER BY created_at DESC LIMIT 1`,
      [order.id]
    );

    if (open.rows.length) {
      payment = open.rows[0];
    } else {
      if (!gatewayName) throw new ApiError(400, "Select a payment gateway first");
      getGateway(gatewayName);
      const payRes = await query(
        `INSERT INTO payments (order_id, gateway, amount_etb, status)
         VALUES ($1,$2,$3,'initiated') RETURNING *`,
        [order.id, gatewayName, order.total_amount_etb]
      );
      payment = payRes.rows[0];
    }

    if (payment.status === "success") {
      throw new ApiError(409, "Payment already approved");
    }

    try {
      const updated = await query(
        `UPDATE payments
         SET gateway_ref = $1,
             buyer_tx_code = $2,
             buyer_reference = $3,
             status = 'awaiting_approval',
             updated_at = now()
         WHERE id = $4
         RETURNING id, gateway, gateway_ref, amount_etb, status, buyer_tx_code, buyer_reference, created_at`,
        [referenceCode, txCode, referenceCode, payment.id]
      );
      payment = updated.rows[0];
    } catch (err) {
      if (err.code === "23505") {
        throw new ApiError(409, "That reference code was already submitted for another payment");
      }
      throw err;
    }

    const full = await getOrderWithTickets(order.id);
    res.json({
      message: "Payment codes submitted. Waiting for admin approval.",
      payment,
      order: full.order,
      tickets: full.tickets,
    });
  })
);

module.exports = router;
