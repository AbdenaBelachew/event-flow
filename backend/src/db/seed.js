/* Seeds a demo company, admin + gate-staff users, one published event with
   ticket types. Run AFTER `npm run migrate`. Idempotent-ish: safe to re-run
   (it upserts the company/users by unique keys and skips if event exists). */
const bcrypt = require("bcryptjs");
const { pool, withTransaction } = require("../config/db");

async function seed() {
  await withTransaction(async (client) => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Company
    const company = await client.query(
      `INSERT INTO companies (name, slug, contact_email, contact_phone)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ["Addis Events Co.", "addis-events", "organizer@addisevents.et", "+251911000000"]
    );
    const companyId = company.rows[0].id;

    // Platform owner (system owner) — no company affiliation
    await client.query(
      `INSERT INTO users (company_id, full_name, email, password_hash, role)
       VALUES (NULL,$1,$2,$3,'super_admin')
       ON CONFLICT (email) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         password_hash = EXCLUDED.password_hash,
         role = 'super_admin',
         company_id = NULL
       RETURNING id`,
      ["System Owner", "owner@eventflow.et", passwordHash]
    );

    // Company organizer
    const admin = await client.query(
      `INSERT INTO users (company_id, full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4,'company_admin')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [companyId, "Meron Admin", "admin@addisevents.et", passwordHash]
    );
    const adminId = admin.rows[0].id;

    // Event (only create if none exists for this company)
    const existing = await client.query(
      `SELECT id FROM events WHERE company_id = $1 LIMIT 1`,
      [companyId]
    );

    let eventId;
    if (existing.rows.length) {
      eventId = existing.rows[0].id;
    } else {
      const now = new Date();
      const salesStart = new Date(now.getTime() - 1 * 24 * 3600 * 1000);
      const salesEnd = new Date(now.getTime() + 20 * 24 * 3600 * 1000);
      const eventStart = new Date(now.getTime() + 21 * 24 * 3600 * 1000);
      const eventEnd = new Date(now.getTime() + 21 * 24 * 3600 * 1000 + 5 * 3600 * 1000);

      const ev = await client.query(
        `INSERT INTO events
           (company_id, title, description, venue, city,
            event_start, event_end, sales_start, sales_end, status, cover_image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published',$10)
         RETURNING id`,
        [
          companyId,
          "Ethiopian Music Festival 2026",
          "A night of live Ethiopian music, food, and culture.",
          "Millennium Hall",
          "Addis Ababa",
          eventStart,
          eventEnd,
          salesStart,
          salesEnd,
          "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
        ]
      );
      eventId = ev.rows[0].id;

      await client.query(
        `INSERT INTO ticket_types (event_id, name, price_etb, quantity_total, max_per_order)
         VALUES
           ($1,'Early Bird', 500.00, 100, 5),
           ($1,'Regular', 800.00, 500, 10),
           ($1,'VIP', 2500.00, 50, 4)`,
        [eventId]
      );
    }

    // Gate staff scoped to the event
    await client.query(
      `INSERT INTO users (company_id, full_name, email, password_hash, role, assigned_event_id)
       VALUES ($1,$2,$3,$4,'event_staff',$5)
       ON CONFLICT (email) DO UPDATE SET assigned_event_id = EXCLUDED.assigned_event_id`,
      [companyId, "Gate Staff", "staff@addisevents.et", passwordHash, eventId]
    );

    // eslint-disable-next-line no-console
    console.log("✅ Seed complete");
    console.log("   System owner:  owner@eventflow.et / Password123!");
    console.log("   Company admin: admin@addisevents.et / Password123!");
    console.log("   Gate staff:    staff@addisevents.et / Password123!");
    console.log(`   Event ID:      ${eventId}`);
    console.log(`   Admin ID:      ${adminId}`);
  });
}

if (require.main === module) {
  seed()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Seed failed:", err);
      process.exit(1);
    });
}

module.exports = { seed };
