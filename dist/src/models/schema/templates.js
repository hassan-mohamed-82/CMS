"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templatesRelations = exports.templates = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const activities_1 = require("./activities");
const websites_1 = require("./websites");
exports.templates = (0, mysql_core_1.mysqlTable)("templates", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull().unique(),
    templateFilePath: (0, mysql_core_1.varchar)("template_file_path", { length: 500 }).notNull(),
    photo: (0, mysql_core_1.varchar)("photo", { length: 500 }).notNull(),
    overphoto: (0, mysql_core_1.varchar)("overphoto", { length: 500 }),
    isActive: (0, mysql_core_1.boolean)("is_active").default(true),
    isNew: (0, mysql_core_1.boolean)("is_new").default(true),
    activityId: (0, mysql_core_1.int)("activity_id").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.templatesRelations = (0, drizzle_orm_1.relations)(exports.templates, ({ one, many }) => ({
    activity: one(activities_1.activities, {
        fields: [exports.templates.activityId],
        references: [activities_1.activities.id],
    }),
    websites: many(websites_1.websites),
}));
