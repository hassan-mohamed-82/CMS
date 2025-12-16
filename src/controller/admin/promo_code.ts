import { Request, Response } from "express";
import { db } from "../../models/connection";
import { promoCodes } from "../../models/schema/promo_code";
import { promocodePlans } from "../../models/schema/promocode_plans";
import { plans } from "../../models/schema/plans";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";

export const createPromoCodeWithPlans = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("access denied");

  const { promoCodeData, planLinks } = req.body;

  if (!promoCodeData || !planLinks)
    throw new BadRequest("Missing promo code data or plan links");

  const [result] = await db
    .insert(promoCodes)
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

  const plansToInsert = planLinks.map((link: any) => ({
    codeId: result.id,
    planId: link.planId,
    appliesToMonthly: link.applies_to_monthly ?? false,
    appliesToQuarterly: link.applies_to_quarterly ?? false,
    appliesToSemiAnnually: link.applies_to_semi_annually ?? false,
    appliesToYearly: link.applies_to_yearly ?? false,
  }));

  await db.insert(promocodePlans).values(plansToInsert);

  const [promoCode] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.id, result.id));

  SuccessResponse(res, {
    message: "Promo code created with linked plans",
    promoCode,
  });
};

export const getAllPromoCodesWithPlans = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("access denied");

  const allPromoCodes = await db.select().from(promoCodes);

  const promosWithPlans = await Promise.all(
    allPromoCodes.map(async (promo) => {
      const promoPlans = await db
        .select({
          promocodePlan: promocodePlans,
          plan: plans,
        })
        .from(promocodePlans)
        .leftJoin(plans, eq(promocodePlans.planId, plans.id))
        .where(eq(promocodePlans.codeId, promo.id));

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
    })
  );

  SuccessResponse(res, { promos: promosWithPlans });
};

export const getPromoCodeWithPlansById = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("access denied");

  const { id } = req.params;

  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.id, Number(id)));

  if (!promo) throw new NotFound("Promo code not found");

  const promoPlans = await db
    .select({
      promocodePlan: promocodePlans,
      plan: plans,
    })
    .from(promocodePlans)
    .leftJoin(plans, eq(promocodePlans.planId, plans.id))
    .where(eq(promocodePlans.codeId, promo.id));

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

  SuccessResponse(res, { promo: formattedPromo, plans: formattedPlans });
};

export const updatePromoCodeWithPlans = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("access denied");

  const { id } = req.params;
  const { promoCodeData, planLinks } = req.body;

  const [existingPromo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.id, Number(id)));

  if (!existingPromo) throw new NotFound("Promo code not found");

  const updateData: Partial<typeof promoCodes.$inferInsert> = {};
  if (promoCodeData.code) updateData.code = promoCodeData.code;
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
  if (promoCodeData.status) updateData.status = promoCodeData.status;

  await db
    .update(promoCodes)
    .set(updateData)
    .where(eq(promoCodes.id, Number(id)));

  // Delete old plan links
  await db.delete(promocodePlans).where(eq(promocodePlans.codeId, Number(id)));

  // Add new plan links
  if (planLinks && planLinks.length > 0) {
    const plansToInsert = planLinks.map((link: any) => ({
      codeId: Number(id),
      planId: link.planId,
      appliesToMonthly: link.applies_to_monthly ?? false,
      appliesToQuarterly: link.applies_to_quarterly ?? false,
      appliesToSemiAnnually: link.applies_to_semi_annually ?? false,
      appliesToYearly: link.applies_to_yearly ?? false,
    }));

    await db.insert(promocodePlans).values(plansToInsert);
  }

  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.id, Number(id)));

  SuccessResponse(res, { message: "Promo code and plans updated", promo });
};

export const deletePromoCodeWithPlans = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("access denied");

  const { id } = req.params;

  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.id, Number(id)));

  if (!promo) throw new NotFound("Promo code not found");

  await db.delete(promocodePlans).where(eq(promocodePlans.codeId, Number(id)));
  await db.delete(promoCodes).where(eq(promoCodes.id, Number(id)));

  SuccessResponse(res, { message: "Promo code and linked plans deleted" });
};
