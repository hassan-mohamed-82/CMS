import { mysqlTable, int, varchar, boolean, text, timestamp } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { payments } from "./payments";

export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  description: text("description").notNull(),
  logoUrl: varchar("logo_url", { length: 500 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  payments: many(payments),
}));

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;


