import { Request, Response } from "express";
import { db } from "../../models/connection";
import { subscriptions } from "../../models/schema/subscriptions";
import { users } from "../../models/schema/auth/User";
import { plans } from "../../models/schema/plans";
import { payments } from "../../models/schema/payments";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

export const getAllSubscription = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("access denied");

  const allSubscriptions = await db
    .select({
      subscription: subscriptions,
      user: users,
      plan: plans,
      payment: payments,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .leftJoin(payments, eq(subscriptions.paymentId, payments.id));

  const formattedData = allSubscriptions.map((item) => ({
    ...item.subscription,
    userId: item.user,
    planId: item.plan,
    PaymentId: item.payment,
  }));

  if (!formattedData || formattedData.length === 0)
    throw new NotFound("No subscription found");

  SuccessResponse(res, {
    message: "All subscription fetched successfully",
    data: formattedData,
  });
};

export const getSubscriptionById = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide subscription id");

  const [result] = await db
    .select({
      subscription: subscriptions,
      user: users,
      plan: plans,
      payment: payments,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .leftJoin(payments, eq(subscriptions.paymentId, payments.id))
    .where(eq(subscriptions.id, Number(id)));

  if (!result) throw new NotFound("Subscription not found");

  const data = {
    ...result.subscription,
    userId: result.user,
    planId: result.plan,
    PaymentId: result.payment,
  };

  SuccessResponse(res, { message: "Subscription fetched successfully", data });
};
