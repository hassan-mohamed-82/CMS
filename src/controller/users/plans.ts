import { Request, Response } from "express";
import { db } from "../../models/connection";
import { plans } from "../../models/schema/plans";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";

export const getAllPlans = async (req: Request, res: Response) => {
  const allPlans = await db.select().from(plans);
  SuccessResponse(res, { message: "All plans fetched successfully", plans: allPlans });
};

export const getPlanById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide plan id");

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, Number(id)));

  if (!plan) throw new NotFound("Plan not found");

  SuccessResponse(res, { message: "Plan fetched successfully", plan });
};
