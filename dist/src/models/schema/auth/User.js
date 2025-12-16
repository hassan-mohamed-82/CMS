"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRelations = exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const plans_1 = require("../plans");
const payments_1 = require("../payments");
const subscriptions_1 = require("../subscriptions");
const websites_1 = require("../websites");
const emailVerifications_1 = require("./emailVerifications");
const promocode_users_1 = require("../promocode_users");
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).unique(),
    password: (0, mysql_core_1.varchar)("password", { length: 255 }),
    phonenumber: (0, mysql_core_1.varchar)("phonenumber", { length: 50 }),
    isVerified: (0, mysql_core_1.boolean)("is_verified").default(false),
    googleId: (0, mysql_core_1.varchar)("google_id", { length: 255 }).unique(),
    planId: (0, mysql_core_1.int)("plan_id"),
    firstTimeBuyer: (0, mysql_core_1.boolean)("first_time_buyer").default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one, many }) => ({
    plan: one(plans_1.plans, {
        fields: [exports.users.planId],
        references: [plans_1.plans.id],
    }),
    payments: many(payments_1.payments),
    subscriptions: many(subscriptions_1.subscriptions),
    websites: many(websites_1.websites),
    emailVerifications: many(emailVerifications_1.emailVerifications),
    promocodeUsers: many(promocode_users_1.promocodeUsers),
}));
