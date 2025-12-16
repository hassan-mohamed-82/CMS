"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoCodesRelations = exports.promoCodes = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const promocode_plans_1 = require("./promocode_plans");
const promocode_users_1 = require("./promocode_users");
exports.promoCodes = (0, mysql_core_1.mysqlTable)("promo_codes", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    code: (0, mysql_core_1.varchar)("code", { length: 255 }).notNull().unique(),
    startDate: (0, mysql_core_1.timestamp)("start_date").notNull(),
    endDate: (0, mysql_core_1.timestamp)("end_date").notNull(),
    discountType: (0, mysql_core_1.mysqlEnum)("discount_type", ["percentage", "amount"]).default("percentage"),
    discountValue: (0, mysql_core_1.decimal)("discount_value", { precision: 10, scale: 2 }).notNull(),
    isActive: (0, mysql_core_1.boolean)("is_active").default(true),
    maxUsers: (0, mysql_core_1.int)("max_users").default(0),
    availableUsers: (0, mysql_core_1.int)("available_users").default(0),
    status: (0, mysql_core_1.mysqlEnum)("status", ["first_time", "All", "renew"]).default("first_time"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.promoCodesRelations = (0, drizzle_orm_1.relations)(exports.promoCodes, ({ many }) => ({
    promocodePlans: many(promocode_plans_1.promocodePlans),
    promocodeUsers: many(promocode_users_1.promocodeUsers),
}));
