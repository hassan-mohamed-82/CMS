import { mysqlTable, int, varchar, decimal, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./auth/User";
import { plans } from "./plans";
import { paymentMethods } from "./payment_methods";
import { subscriptions } from "./subscriptions";

export const payments = mysqlTable("payments", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  planId: int("plan_id").notNull(),
  paymentMethodId: int("payment_method_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  rejectedReason: varchar("rejected_reason", { length: 500 }),
  code: varchar("code", { length: 255 }),
  paymentDate: timestamp("payment_date").notNull(),
  subscriptionType: mysqlEnum("subscription_type", ["monthly", "quarterly", "semi_annually", "annually"]).default("quarterly"),
  photo: varchar("photo", { length: 500 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [payments.planId],
    references: [plans.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [payments.paymentMethodId],
    references: [paymentMethods.id],
  }),
  subscriptions: many(subscriptions),
}));

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;


