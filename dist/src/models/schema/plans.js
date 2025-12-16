"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plansRelations = exports.plans = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const User_1 = require("./auth/User");
const payments_1 = require("./payments");
const subscriptions_1 = require("./subscriptions");
const promocode_plans_1 = require("./promocode_plans");
exports.plans = (0, mysql_core_1.mysqlTable)("plans", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull().unique(),
    priceMonthly: (0, mysql_core_1.decimal)("price_monthly", { precision: 10, scale: 2 }),
    priceQuarterly: (0, mysql_core_1.decimal)("price_quarterly", { precision: 10, scale: 2 }),
    priceSemiAnnually: (0, mysql_core_1.decimal)("price_semi_annually", { precision: 10, scale: 2 }),
    priceAnnually: (0, mysql_core_1.decimal)("price_annually", { precision: 10, scale: 2 }),
    websiteLimit: (0, mysql_core_1.int)("website_limit"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.plansRelations = (0, drizzle_orm_1.relations)(exports.plans, ({ many }) => ({
    users: many(User_1.users),
    payments: many(payments_1.payments),
    subscriptions: many(subscriptions_1.subscriptions),
    promocodePlans: many(promocode_plans_1.promocodePlans),
}));
