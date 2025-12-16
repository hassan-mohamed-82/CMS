"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admins = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
exports.admins = (0, mysql_core_1.mysqlTable)("admins", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    hashedPassword: (0, mysql_core_1.varchar)("hashed_password", { length: 255 }).notNull(),
    imagePath: (0, mysql_core_1.varchar)("image_path", { length: 500 }),
    phoneNumber: (0, mysql_core_1.varchar)("phone_number", { length: 50 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
