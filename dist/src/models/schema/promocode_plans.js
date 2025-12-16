"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promocodePlansRelations = exports.promocodePlans = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const promo_code_1 = require("./promo_code");
const plans_1 = require("./plans");
exports.promocodePlans = (0, mysql_core_1.mysqlTable)("promocode_plans", {
    id: (0, mysql_core_1.int)("id").primaryKey().autoincrement(),
    codeId: (0, mysql_core_1.int)("code_id").notNull(),
    planId: (0, mysql_core_1.int)("plan_id").notNull(),
    appliesToMonthly: (0, mysql_core_1.boolean)("applies_to_monthly").default(false),
    appliesToQuarterly: (0, mysql_core_1.boolean)("applies_to_quarterly").default(false),
    appliesToSemiAnnually: (0, mysql_core_1.boolean)("applies_to_semi_annually").default(false),
    appliesToYearly: (0, mysql_core_1.boolean)("applies_to_yearly").default(false),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.promocodePlansRelations = (0, drizzle_orm_1.relations)(exports.promocodePlans, ({ one }) => ({
    promoCode: one(promo_code_1.promoCodes, {
        fields: [exports.promocodePlans.codeId],
        references: [promo_code_1.promoCodes.id],
    }),
    plan: one(plans_1.plans, {
        fields: [exports.promocodePlans.planId],
        references: [plans_1.plans.id],
    }),
}));
