import { mysqlTable, int, boolean, timestamp } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { promoCodes } from "./promo_code";
import { plans } from "./plans";

export const promocodePlans = mysqlTable("promocode_plans", {
  id: int("id").primaryKey().autoincrement(),
  codeId: int("code_id").notNull(),
  planId: int("plan_id").notNull(),
  appliesToMonthly: boolean("applies_to_monthly").default(false),
  appliesToQuarterly: boolean("applies_to_quarterly").default(false),
  appliesToSemiAnnually: boolean("applies_to_semi_annually").default(false),
  appliesToYearly: boolean("applies_to_yearly").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const promocodePlansRelations = relations(promocodePlans, ({ one }) => ({
  promoCode: one(promoCodes, {
    fields: [promocodePlans.codeId],
    references: [promoCodes.id],
  }),
  plan: one(plans, {
    fields: [promocodePlans.planId],
    references: [plans.id],
  }),
}));

export type PromocodePlan = typeof promocodePlans.$inferSelect;
export type NewPromocodePlan = typeof promocodePlans.$inferInsert;


