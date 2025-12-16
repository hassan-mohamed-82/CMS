"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePromoCodeWithPlans = exports.updatePromoCodeWithPlans = exports.getPromoCodeWithPlansById = exports.getAllPromoCodesWithPlans = exports.createPromoCodeWithPlans = void 0;
const connection_1 = require("../../models/connection");
const promo_code_1 = require("../../models/schema/promo_code");
const promocode_plans_1 = require("../../models/schema/promocode_plans");
const plans_1 = require("../../models/schema/plans");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const createPromoCodeWithPlans = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("access denied");
    const { promoCodeData, planLinks } = req.body;
    if (!promoCodeData || !planLinks)
        throw new BadRequest_1.BadRequest("Missing promo code data or plan links");
    const [result] = await connection_1.db
        .insert(promo_code_1.promoCodes)
        .values({
        code: promoCodeData.code,
        startDate: new Date(promoCodeData.start_date),
        endDate: new Date(promoCodeData.end_date),
        discountType: promoCodeData.discount_type,
        discountValue: String(promoCodeData.discount_value),
        isActive: promoCodeData.isActive ?? true,
        maxUsers: promoCodeData.maxusers,
        availableUsers: promoCodeData.maxusers,
        status: promoCodeData.status,
    })
        .$returningId();
    const plansToInsert = planLinks.map((link) => ({
        codeId: result.id,
        planId: link.planId,
        appliesToMonthly: link.applies_to_monthly ?? false,
        appliesToQuarterly: link.applies_to_quarterly ?? false,
        appliesToSemiAnnually: link.applies_to_semi_annually ?? false,
        appliesToYearly: link.applies_to_yearly ?? false,
    }));
    await connection_1.db.insert(promocode_plans_1.promocodePlans).values(plansToInsert);
    const [promoCode] = await connection_1.db
        .select()
        .from(promo_code_1.promoCodes)
        .where((0, drizzle_orm_1.eq)(promo_code_1.promoCodes.id, result.id));
    (0, response_1.SuccessResponse)(res, {
        message: "Promo code created with linked plans",
        promoCode,
    });
};
exports.createPromoCodeWithPlans = createPromoCodeWithPlans;
const getAllPromoCodesWithPlans = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("access denied");
    const allPromoCodes = await connection_1.db.select().from(promo_code_1.promoCodes);
    const promosWithPlans = await Promise.all(allPromoCodes.map(async (promo) => {
        const promoPlans = await connection_1.db
            .select({
            promocodePlan: promocode_plans_1.promocodePlans,
            plan: plans_1.plans,
        })
            .from(promocode_plans_1.promocodePlans)
            .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(promocode_plans_1.promocodePlans.planId, plans_1.plans.id))
            .where((0, drizzle_orm_1.eq)(promocode_plans_1.promocodePlans.codeId, promo.id));
        const formattedPlans = promoPlans.map((pp) => ({
            ...pp.promocodePlan,
            planId: pp.plan,
        }));
        return {
            ...promo,
            start_date: promo.startDate
                ? new Date(promo.startDate).toISOString().split("T")[0]
                : null,
            end_date: promo.endDate
                ? new Date(promo.endDate).toISOString().split("T")[0]
                : null,
            plans: formattedPlans,
        };
    }));
    (0, response_1.SuccessResponse)(res, { promos: promosWithPlans });
};
exports.getAllPromoCodesWithPlans = getAllPromoCodesWithPlans;
const getPromoCodeWithPlansById = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("access denied");
    const { id } = req.params;
    const [promo] = await connection_1.db
        .select()
        .from(promo_code_1.promoCodes)
        .where((0, drizzle_orm_1.eq)(promo_code_1.promoCodes.id, Number(id)));
    if (!promo)
        throw new NotFound_1.NotFound("Promo code not found");
    const promoPlans = await connection_1.db
        .select({
        promocodePlan: promocode_plans_1.promocodePlans,
        plan: plans_1.plans,
    })
        .from(promocode_plans_1.promocodePlans)
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(promocode_plans_1.promocodePlans.planId, plans_1.plans.id))
        .where((0, drizzle_orm_1.eq)(promocode_plans_1.promocodePlans.codeId, promo.id));
    const formattedPlans = promoPlans.map((pp) => ({
        ...pp.promocodePlan,
        planId: pp.plan,
    }));
    const formattedPromo = {
        ...promo,
        start_date: promo.startDate
            ? new Date(promo.startDate).toISOString().split("T")[0]
            : null,
        end_date: promo.endDate
            ? new Date(promo.endDate).toISOString().split("T")[0]
            : null,
    };
    (0, response_1.SuccessResponse)(res, { promo: formattedPromo, plans: formattedPlans });
};
exports.getPromoCodeWithPlansById = getPromoCodeWithPlansById;
const updatePromoCodeWithPlans = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("access denied");
    const { id } = req.params;
    const { promoCodeData, planLinks } = req.body;
    const [existingPromo] = await connection_1.db
        .select()
        .from(promo_code_1.promoCodes)
        .where((0, drizzle_orm_1.eq)(promo_code_1.promoCodes.id, Number(id)));
    if (!existingPromo)
        throw new NotFound_1.NotFound("Promo code not found");
    const updateData = {};
    if (promoCodeData.code)
        updateData.code = promoCodeData.code;
    if (promoCodeData.start_date)
        updateData.startDate = new Date(promoCodeData.start_date);
    if (promoCodeData.end_date)
        updateData.endDate = new Date(promoCodeData.end_date);
    if (promoCodeData.discount_type)
        updateData.discountType = promoCodeData.discount_type;
    if (promoCodeData.discount_value)
        updateData.discountValue = String(promoCodeData.discount_value);
    if (promoCodeData.isActive !== undefined)
        updateData.isActive = promoCodeData.isActive;
    if (promoCodeData.maxusers !== undefined)
        updateData.maxUsers = promoCodeData.maxusers;
    if (promoCodeData.available_users !== undefined)
        updateData.availableUsers = promoCodeData.available_users;
    if (promoCodeData.status)
        updateData.status = promoCodeData.status;
    await connection_1.db
        .update(promo_code_1.promoCodes)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(promo_code_1.promoCodes.id, Number(id)));
    // Delete old plan links
    await connection_1.db.delete(promocode_plans_1.promocodePlans).where((0, drizzle_orm_1.eq)(promocode_plans_1.promocodePlans.codeId, Number(id)));
    // Add new plan links
    if (planLinks && planLinks.length > 0) {
        const plansToInsert = planLinks.map((link) => ({
            codeId: Number(id),
            planId: link.planId,
            appliesToMonthly: link.applies_to_monthly ?? false,
            appliesToQuarterly: link.applies_to_quarterly ?? false,
            appliesToSemiAnnually: link.applies_to_semi_annually ?? false,
            appliesToYearly: link.applies_to_yearly ?? false,
        }));
        await connection_1.db.insert(promocode_plans_1.promocodePlans).values(plansToInsert);
    }
    const [promo] = await connection_1.db
        .select()
        .from(promo_code_1.promoCodes)
        .where((0, drizzle_orm_1.eq)(promo_code_1.promoCodes.id, Number(id)));
    (0, response_1.SuccessResponse)(res, { message: "Promo code and plans updated", promo });
};
exports.updatePromoCodeWithPlans = updatePromoCodeWithPlans;
const deletePromoCodeWithPlans = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("access denied");
    const { id } = req.params;
    const [promo] = await connection_1.db
        .select()
        .from(promo_code_1.promoCodes)
        .where((0, drizzle_orm_1.eq)(promo_code_1.promoCodes.id, Number(id)));
    if (!promo)
        throw new NotFound_1.NotFound("Promo code not found");
    await connection_1.db.delete(promocode_plans_1.promocodePlans).where((0, drizzle_orm_1.eq)(promocode_plans_1.promocodePlans.codeId, Number(id)));
    await connection_1.db.delete(promo_code_1.promoCodes).where((0, drizzle_orm_1.eq)(promo_code_1.promoCodes.id, Number(id)));
    (0, response_1.SuccessResponse)(res, { message: "Promo code and linked plans deleted" });
};
exports.deletePromoCodeWithPlans = deletePromoCodeWithPlans;
