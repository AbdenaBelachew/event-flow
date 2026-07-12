const { query } = require("../../config/db");

/**
 * Ticketing domain helpers shared by orders + payments modules.
 */

/** Marks all tickets of a paid order as valid and the order as paid. Idempotent. */
async function issueTicketsForOrder(client, orderId) {
  await client.query(
    `UPDATE tickets SET status = 'valid'
     WHERE order_id = $1 AND status = 'unpaid'`,
    [orderId]
  );
  await client.query(
    `UPDATE orders SET status = 'paid' WHERE id = $1 AND status <> 'paid'`,
    [orderId]
  );
  // Flip event to sold_out if every active ticket type is exhausted.
  await client.query(
    `UPDATE events e SET status = 'sold_out'
     WHERE e.id = (SELECT event_id FROM orders WHERE id = $1)
       AND e.status = 'published'
       AND NOT EXISTS (
         SELECT 1 FROM ticket_types tt
         WHERE tt.event_id = e.id AND tt.is_active = true
           AND tt.quantity_sold < tt.quantity_total
       )`,
    [orderId]
  );
}

/** Releases reserved stock for a failed/cancelled order and voids its tickets. */
async function releaseOrder(client, orderId, newStatus = "failed") {
  // Return stock per ticket type for the still-unpaid tickets.
  await client.query(
    `UPDATE ticket_types tt
     SET quantity_sold = quantity_sold - sub.cnt
     FROM (
       SELECT ticket_type_id, COUNT(*)::int AS cnt
       FROM tickets
       WHERE order_id = $1 AND status = 'unpaid'
       GROUP BY ticket_type_id
     ) sub
     WHERE tt.id = sub.ticket_type_id`,
    [orderId]
  );
  await client.query(
    `UPDATE tickets SET status = 'void' WHERE order_id = $1 AND status = 'unpaid'`,
    [orderId]
  );
  await client.query(`UPDATE orders SET status = $2 WHERE id = $1`, [orderId, newStatus]);
}

async function getOrderWithTickets(orderId) {
  const order = await query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (!order.rows.length) return null;
  const tickets = await query(
    `SELECT t.id, t.ticket_code, t.holder_name, t.status, t.issued_at, t.used_at,
            tt.name AS ticket_type, tt.price_etb
     FROM tickets t JOIN ticket_types tt ON tt.id = t.ticket_type_id
     WHERE t.order_id = $1 ORDER BY t.issued_at ASC`,
    [orderId]
  );
  const payment = await query(
    `SELECT id, gateway, gateway_ref, amount_etb, status, created_at
     FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  );
  return { order: order.rows[0], tickets: tickets.rows, payment: payment.rows[0] || null };
}

module.exports = { issueTicketsForOrder, releaseOrder, getOrderWithTickets };
