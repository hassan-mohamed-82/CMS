"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodsRelations = exports.paymentMethods = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const payments_1 = require("./payments");
exports.paymentMethods = (0, mysql_core_1.mysqlTable)("payment_methods", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull().unique(),
    isActive: (0, mysql_core_1.boolean)("is_active").default(true),
    description: (0, mysql_core_1.text)("description").notNull(),
    logoUrl: (0, mysql_core_1.varchar)("logo_url", { length: 500 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.paymentMethodsRelations = (0, drizzle_orm_1.relations)(exports.paymentMethods, ({ many }) => ({
    payments: many(payments_1.payments),
}));
