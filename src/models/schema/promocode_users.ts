import { mysqlTable, int, timestamp } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./auth/User";
import { promoCodes } from "./promo_code";

export const promocodeUsers = mysqlTable("promocode_users", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  codeId: int("code_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const promocodeUsersRelations = relations(promocodeUsers, ({ one }) => ({
  user: one(users, {
    fields: [promocodeUsers.userId],
    references: [users.id],
  }),
  promoCode: one(promoCodes, {
    fields: [promocodeUsers.codeId],
    references: [promoCodes.id],
  }),
}));

export type PromocodeUser = typeof promocodeUsers.$inferSelect;
export type NewPromocodeUser = typeof promocodeUsers.$inferInsert;


