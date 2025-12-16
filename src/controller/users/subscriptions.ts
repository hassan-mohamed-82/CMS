import { Request, Response } from "express";
import { db } from "../../models/connection";
import { subscriptions } from "../../models/schema/subscriptions";
import { plans } from "../../models/schema/plans";
import { payments } from "../../models/schema/payments";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

export const getAllSubscriptions = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const userId = req.user.id;

  const allSubscriptions = await db
    .select({
      subscription: subscriptions,
      plan: plans,
      payment: payments,
    })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .leftJoin(payments, eq(subscriptions.paymentId, payments.id))
    .where(eq(subscriptions.userId, Number(userId)));

  const formattedSubscriptions = allSubscriptions.map((item) => ({
    ...item.subscription,
    planId: item.plan,
    PaymentId: item.payment,
  }));

  if (!formattedSubscriptions || formattedSubscriptions.length === 0)
    throw new NotFound("No subscriptions found");

  SuccessResponse(res, {
    message: "All subscriptions fetched successfully",
    subscriptions: formattedSubscriptions,
  });
};

export const getSubscriptionById = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const { id } = req.params;

  const [result] = await db
    .select({
      subscription: subscriptions,
      plan: plans,
      payment: payments,
    })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .leftJoin(payments, eq(subscriptions.paymentId, payments.id))
    .where(eq(subscriptions.id, Number(id)));

  if (!result) throw new NotFound("Subscription not found");

  const subscription = {
    ...result.subscription,
    planId: result.plan,
    PaymentId: result.payment,
  };

  SuccessResponse(res, {
    message: "Subscription fetched successfully",
    subscription,
  });
};
