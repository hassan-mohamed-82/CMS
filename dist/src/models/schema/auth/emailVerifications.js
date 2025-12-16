"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerificationsRelations = exports.emailVerifications = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const User_1 = require("./User");
exports.emailVerifications = (0, mysql_core_1.mysqlTable)("email_verifications", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    userId: (0, mysql_core_1.int)("user_id").notNull(),
    verificationCode: (0, mysql_core_1.varchar)("verification_code", { length: 255 }).notNull(),
    expiresAt: (0, mysql_core_1.timestamp)("expires_at").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.emailVerificationsRelations = (0, drizzle_orm_1.relations)(exports.emailVerifications, ({ one }) => ({
    user: one(User_1.users, {
        fields: [exports.emailVerifications.userId],
        references: [User_1.users.id],
    }),
}));
