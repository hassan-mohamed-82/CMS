import { mysqlTable, int, varchar, boolean, timestamp } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { activities } from "./activities";
import { websites } from "./websites";

export const templates = mysqlTable("templates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  templateFilePath: varchar("template_file_path", { length: 500 }).notNull(),
  photo: varchar("photo", { length: 500 }).notNull(),
  overphoto: varchar("overphoto", { length: 500 }),
  isActive: boolean("is_active").default(true),
  isNew: boolean("is_new").default(true),
  activityId: int("activity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const templatesRelations = relations(templates, ({ one, many }) => ({
  activity: one(activities, {
    fields: [templates.activityId],
    references: [activities.id],
  }),
  websites: many(websites),
}));

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;


