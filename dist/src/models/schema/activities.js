"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activitiesRelations = exports.activities = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const templates_1 = require("./templates");
exports.activities = (0, mysql_core_1.mysqlTable)("activities", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull().unique(),
    isActive: (0, mysql_core_1.boolean)("is_active").default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.activitiesRelations = (0, drizzle_orm_1.relations)(exports.activities, ({ many }) => ({
    templates: many(templates_1.templates),
}));
