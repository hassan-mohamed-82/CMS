"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promocodeUsersRelations = exports.promocodeUsers = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const User_1 = require("./auth/User");
const promo_code_1 = require("./promo_code");
exports.promocodeUsers = (0, mysql_core_1.mysqlTable)("promocode_users", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    userId: (0, mysql_core_1.int)("user_id").notNull(),
    codeId: (0, mysql_core_1.int)("code_id").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.promocodeUsersRelations = (0, drizzle_orm_1.relations)(exports.promocodeUsers, ({ one }) => ({
    user: one(User_1.users, {
        fields: [exports.promocodeUsers.userId],
        references: [User_1.users.id],
    }),
    promoCode: one(promo_code_1.promoCodes, {
        fields: [exports.promocodeUsers.codeId],
        references: [promo_code_1.promoCodes.id],
    }),
}));
