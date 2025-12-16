import { mysqlTable, int, varchar, boolean, decimal, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { promocodePlans } from "./promocode_plans";
import { promocodeUsers } from "./promocode_users";

export const promoCodes = mysqlTable("promo_codes", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  discountType: mysqlEnum("discount_type", ["percentage", "amount"]).default("percentage"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  maxUsers: int("max_users").default(0),
  availableUsers: int("available_users").default(0),
  status: mysqlEnum("status", ["first_time", "All", "renew"]).default("first_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const promoCodesRelations = relations(promoCodes, ({ many }) => ({
  promocodePlans: many(promocodePlans),
  promocodeUsers: many(promocodeUsers),
}));

export type PromoCode = typeof promoCodes.$inferSelect;
export type NewPromoCode = typeof promoCodes.$inferInsert;


