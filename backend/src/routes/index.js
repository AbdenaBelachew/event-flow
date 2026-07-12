const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const companiesRoutes = require("../modules/companies/companies.routes");
const eventsRoutes = require("../modules/events/events.routes");
const ticketTypesRoutes = require("../modules/ticketTypes/ticketTypes.routes");
const ordersRoutes = require("../modules/orders/orders.routes");
const paymentsRoutes = require("../modules/payments/payments.routes");
const ticketsRoutes = require("../modules/tickets/tickets.routes");
const checkInsRoutes = require("../modules/checkIns/checkIns.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/companies", companiesRoutes);

// Events + nested resources
router.use("/events", eventsRoutes);
router.use("/events/:eventId/ticket-types", ticketTypesRoutes);
router.use("/events/:id/check-ins", checkInsRoutes);

// PATCH /api/ticket-types/:id lives on the same router, mounted flat
router.use("/ticket-types", ticketTypesRoutes);

router.use("/orders", ordersRoutes);
router.use("/payments", paymentsRoutes);
router.use("/tickets", ticketsRoutes);

module.exports = router;
