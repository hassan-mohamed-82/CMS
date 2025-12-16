"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRelations = exports.payments = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const User_1 = require("./auth/User");
const plans_1 = require("./plans");
const payment_methods_1 = require("./payment_methods");
const subscriptions_1 = require("./subscriptions");
exports.payments = (0, mysql_core_1.mysqlTable)("payments", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    userId: (0, mysql_core_1.int)("user_id").notNull(),
    planId: (0, mysql_core_1.int)("plan_id").notNull(),
    paymentMethodId: (0, mysql_core_1.int)("payment_method_id").notNull(),
    amount: (0, mysql_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "approved", "rejected"]).default("pending"),
    rejectedReason: (0, mysql_core_1.varchar)("rejected_reason", { length: 500 }),
    code: (0, mysql_core_1.varchar)("code", { length: 255 }),
    paymentDate: (0, mysql_core_1.timestamp)("payment_date").notNull(),
    subscriptionType: (0, mysql_core_1.mysqlEnum)("subscription_type", ["monthly", "quarterly", "semi_annually", "annually"]).default("quarterly"),
    photo: (0, mysql_core_1.varchar)("photo", { length: 500 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.paymentsRelations = (0, drizzle_orm_1.relations)(exports.payments, ({ one, many }) => ({
    user: one(User_1.users, {
        fields: [exports.payments.userId],
        references: [User_1.users.id],
    }),
    plan: one(plans_1.plans, {
        fields: [exports.payments.planId],
        references: [plans_1.plans.id],
    }),
    paymentMethod: one(payment_methods_1.paymentMethods, {
        fields: [exports.payments.paymentMethodId],
        references: [payment_methods_1.paymentMethods.id],
    }),
    subscriptions: many(subscriptions_1.subscriptions),
}));
