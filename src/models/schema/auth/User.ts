import { mysqlTable, int, varchar, boolean, timestamp } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { plans } from "../plans";
import { payments } from "../payments";
import { subscriptions } from "../subscriptions";
import { websites } from "../websites";
import { emailVerifications } from "./emailVerifications";
import { promocodeUsers } from "../promocode_users";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  phonenumber: varchar("phonenumber", { length: 50 }),
  isVerified: boolean("is_verified").default(false),
  googleId: varchar("google_id", { length: 255 }).unique(),
  planId: int("plan_id"),
  firstTimeBuyer: boolean("first_time_buyer").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  plan: one(plans, {
    fields: [users.planId],
    references: [plans.id],
  }),
  payments: many(payments),
  subscriptions: many(subscriptions),
  websites: many(websites),
  emailVerifications: many(emailVerifications),
  promocodeUsers: many(promocodeUsers),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;


