"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionsRelations = exports.subscriptions = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const User_1 = require("./auth/User");
const plans_1 = require("./plans");
const payments_1 = require("./payments");
exports.subscriptions = (0, mysql_core_1.mysqlTable)("subscriptions", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    userId: (0, mysql_core_1.int)("user_id").notNull(),
    planId: (0, mysql_core_1.int)("plan_id").notNull(),
    paymentId: (0, mysql_core_1.int)("payment_id").notNull(),
    startDate: (0, mysql_core_1.timestamp)("start_date").notNull(),
    endDate: (0, mysql_core_1.timestamp)("end_date").notNull(),
    websitesCreatedCount: (0, mysql_core_1.int)("websites_created_count").default(0),
    websitesRemainingCount: (0, mysql_core_1.int)("websites_remaining_count").default(0),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "expired"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.subscriptionsRelations = (0, drizzle_orm_1.relations)(exports.subscriptions, ({ one }) => ({
    user: one(User_1.users, {
        fields: [exports.subscriptions.userId],
        references: [User_1.users.id],
    }),
    plan: one(plans_1.plans, {
        fields: [exports.subscriptions.planId],
        references: [plans_1.plans.id],
    }),
    payment: one(payments_1.payments, {
        fields: [exports.subscriptions.paymentId],
        references: [payments_1.payments.id],
    }),
}));
