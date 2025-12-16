import { mysqlTable, int, varchar, decimal, timestamp } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./auth/User";
import { payments } from "./payments";
import { subscriptions } from "./subscriptions";
import { promocodePlans } from "./promocode_plans";

export const plans = mysqlTable("plans", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }),
  priceQuarterly: decimal("price_quarterly", { precision: 10, scale: 2 }),
  priceSemiAnnually: decimal("price_semi_annually", { precision: 10, scale: 2 }),
  priceAnnually: decimal("price_annually", { precision: 10, scale: 2 }),
  websiteLimit: int("website_limit"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const plansRelations = relations(plans, ({ many }) => ({
  users: many(users),
  payments: many(payments),
  subscriptions: many(subscriptions),
  promocodePlans: many(promocodePlans),
}));

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;


