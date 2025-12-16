import { mysqlTable, int, varchar, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./auth/User";
import { templates } from "./templates";
import { activities } from "./activities";

export const websites = mysqlTable("websites", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  templateId: int("template_id").notNull(),
  activityId: int("activity_id").notNull(),
  demoLink: varchar("demo_link", { length: 500 }).notNull(),
  projectPath: varchar("project_path", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["demo", "approved", "pending_admin_review", "rejected"]).default("pending_admin_review"),
  rejectedReason: varchar("rejected_reason", { length: 500 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const websitesRelations = relations(websites, ({ one }) => ({
  user: one(users, {
    fields: [websites.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [websites.templateId],
    references: [templates.id],
  }),
  activity: one(activities, {
    fields: [websites.activityId],
    references: [activities.id],
  }),
}));

export type Website = typeof websites.$inferSelect;
export type NewWebsite = typeof websites.$inferInsert;


