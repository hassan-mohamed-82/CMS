import { Request, Response } from "express";
import { db } from "../../models/connection";
import { plans } from "../../models/schema/plans";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";

export const createPlan = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const {
    name,
    price_monthly,
    price_quarterly,
    price_semi_annually,
    price_annually,
    website_limit,
  } = req.body;

  if (
    !name ||
    !price_quarterly ||
    !price_semi_annually ||
    !price_annually ||
    !website_limit ||
    !price_monthly
  )
    throw new BadRequest("Please provide all the required fields");

  const [result] = await db
    .insert(plans)
    .values({
      name,
      priceMonthly: String(price_monthly),
      priceQuarterly: String(price_quarterly),
      priceSemiAnnually: String(price_semi_annually),
      priceAnnually: String(price_annually),
      websiteLimit: website_limit,
    })
    .$returningId();

  const [plan] = await db.select().from(plans).where(eq(plans.id, result.id));

  SuccessResponse(res, { message: "Plan created successfully", plan });
};

export const getAllPlans = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const allPlans = await db.select().from(plans);

  SuccessResponse(res, { message: "All plans fetched successfully", plans: allPlans });
};

export const getPlanById = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide plan id");

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, Number(id)));

  if (!plan) throw new NotFound("Plan not found");

  SuccessResponse(res, { message: "Plan fetched successfully", plan });
};

export const updatePlan = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide plan id");

  const { name, price_quarterly, price_semi_annually, price_annually, website_limit, price_monthly } =
    req.body;

  const [existingPlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, Number(id)));

  if (!existingPlan) throw new NotFound("Plan not found");

  const updateData: Partial<typeof plans.$inferInsert> = {};
  if (name) updateData.name = name;
  if (price_monthly) updateData.priceMonthly = String(price_monthly);
  if (price_quarterly) updateData.priceQuarterly = String(price_quarterly);
  if (price_semi_annually) updateData.priceSemiAnnually = String(price_semi_annually);
  if (price_annually) updateData.priceAnnually = String(price_annually);
  if (website_limit) updateData.websiteLimit = website_limit;

  await db.update(plans).set(updateData).where(eq(plans.id, Number(id)));

  const [plan] = await db.select().from(plans).where(eq(plans.id, Number(id)));

  SuccessResponse(res, { message: "Plan updated successfully", plan });
};

export const deletePlan = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide plan id");

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, Number(id)));

  if (!plan) throw new NotFound("Plan not found");

  await db.delete(plans).where(eq(plans.id, Number(id)));

  SuccessResponse(res, { message: "Plan deleted successfully" });
};
