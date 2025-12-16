"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websitesRelations = exports.websites = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const User_1 = require("./auth/User");
const templates_1 = require("./templates");
const activities_1 = require("./activities");
exports.websites = (0, mysql_core_1.mysqlTable)("websites", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    userId: (0, mysql_core_1.int)("user_id").notNull(),
    templateId: (0, mysql_core_1.int)("template_id").notNull(),
    activityId: (0, mysql_core_1.int)("activity_id").notNull(),
    demoLink: (0, mysql_core_1.varchar)("demo_link", { length: 500 }).notNull(),
    projectPath: (0, mysql_core_1.varchar)("project_path", { length: 500 }).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["demo", "approved", "pending_admin_review", "rejected"]).default("pending_admin_review"),
    rejectedReason: (0, mysql_core_1.varchar)("rejected_reason", { length: 500 }),
    startDate: (0, mysql_core_1.timestamp)("start_date").notNull(),
    endDate: (0, mysql_core_1.timestamp)("end_date").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.websitesRelations = (0, drizzle_orm_1.relations)(exports.websites, ({ one }) => ({
    user: one(User_1.users, {
        fields: [exports.websites.userId],
        references: [User_1.users.id],
    }),
    template: one(templates_1.templates, {
        fields: [exports.websites.templateId],
        references: [templates_1.templates.id],
    }),
    activity: one(activities_1.activities, {
        fields: [exports.websites.activityId],
        references: [activities_1.activities.id],
    }),
}));
