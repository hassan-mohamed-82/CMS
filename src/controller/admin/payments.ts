import { Request, Response } from "express";
import { db } from "../../models/connection";
import { payments } from "../../models/schema/payments";
import { users } from "../../models/schema/auth/User";
import { plans } from "../../models/schema/plans";
import { paymentMethods } from "../../models/schema/payment_methods";
import { subscriptions } from "../../models/schema/subscriptions";
import { promoCodes } from "../../models/schema/promo_code";
import { promocodeUsers } from "../../models/schema/promocode_users";
import { eq, and, lte, gte, gt, desc } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

export const getAllPaymentsAdmin = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const allPayments = await db
    .select({
      payment: payments,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      plan: plans,
      paymentMethod: paymentMethods,
    })
    .from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .leftJoin(plans, eq(payments.planId, plans.id))
    .leftJoin(paymentMethods, eq(payments.paymentMethodId, paymentMethods.id));

  const formattedPayments = allPayments.map((p) => ({
    ...p.payment,
    userId: p.user,
    plan_id: p.plan,
    paymentmethod_id: p.paymentMethod,
  }));

  const pending = formattedPayments.filter((p) => p.status === "pending");
  const history = formattedPayments.filter((p) =>
    ["approved", "rejected"].includes(p.status || "")
  );

  SuccessResponse(res, {
    message: "All payments fetched successfully (admin)",
    payments: {
      pending,
      history,
    },
  });
};

export const getPaymentByIdAdmin = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide payment id");

  const [result] = await db
    .select({
      payment: payments,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      plan: plans,
      paymentMethod: paymentMethods,
    })
    .from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .leftJoin(plans, eq(payments.planId, plans.id))
    .leftJoin(paymentMethods, eq(payments.paymentMethodId, paymentMethods.id))
    .where(eq(payments.id, Number(id)));

  if (!result) throw new NotFound("Payment not found");

  const payment = {
    ...result.payment,
    userId: result.user,
    plan_id: result.plan,
    paymentmethod_id: result.paymentMethod,
  };

  SuccessResponse(res, {
    message: "Payment fetched successfully (admin)",
    payment,
  });
};

export const updatePayment = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  const { status, rejected_reason } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    throw new BadRequest("Status must be either approved or rejected");
  }

  const [paymentResult] = await db
    .select({
      payment: payments,
      plan: plans,
    })
    .from(payments)
    .leftJoin(plans, eq(payments.planId, plans.id))
    .where(eq(payments.id, Number(id)));

  if (!paymentResult) throw new NotFound("Payment not found");

  const payment = paymentResult.payment;
  const plan = paymentResult.plan;

  // Update payment status
  if (status === "rejected") {
    await db
      .update(payments)
      .set({
        status: "rejected",
        rejectedReason: rejected_reason || "No reason provided",
      })
      .where(eq(payments.id, Number(id)));

    const [updatedPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, Number(id)));

    return SuccessResponse(res, {
      message: "Payment rejected",
      payment: updatedPayment,
    });
  }

  // For approved status
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payment.userId));

  if (!user) throw new NotFound("User not found");

  // Check Promo Code
  if (payment.code) {
    const now = new Date();
    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(
        and(
          eq(promoCodes.code, payment.code),
          eq(promoCodes.isActive, true),
          lte(promoCodes.startDate, now),
          gte(promoCodes.endDate, now),
          gt(promoCodes.availableUsers, 0)
        )
      );

    if (promo) {
      await db
        .update(promoCodes)
        .set({ availableUsers: (promo.availableUsers || 0) - 1 })
        .where(eq(promoCodes.id, promo.id));

      const [alreadyUsed] = await db
        .select()
        .from(promocodeUsers)
        .where(
          and(
            eq(promocodeUsers.userId, user.id),
            eq(promocodeUsers.codeId, promo.id)
          )
        );

      if (!alreadyUsed) {
        await db.insert(promocodeUsers).values({
          userId: user.id,
          codeId: promo.id,
        });
      }
    }
  }

  let monthsToAdd = 0;
  const subscriptionType = payment.subscriptionType || "quarterly";
  switch (subscriptionType) {
    case "monthly":
      monthsToAdd = 1;
      break;
    case "quarterly":
      monthsToAdd = 3;
      break;
    case "semi_annually":
      monthsToAdd = 6;
      break;
    case "annually":
      monthsToAdd = 12;
      break;
    default:
      throw new BadRequest("Invalid subscription type");
  }

  // Handle subscription
  if (!user.planId) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + monthsToAdd);

    await db.insert(subscriptions).values({
      userId: user.id,
      planId: plan!.id,
      paymentId: payment.id,
      startDate,
      endDate,
      status: "active",
      websitesCreatedCount: 0,
      websitesRemainingCount: plan?.websiteLimit || 0,
    });

    await db.update(users).set({ planId: plan!.id }).where(eq(users.id, user.id));
  } else if (user.planId === plan!.id) {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.planId, plan!.id),
          eq(subscriptions.status, "active")
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!subscription) throw new NotFound("Active subscription not found");

    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);

    await db
      .update(subscriptions)
      .set({ endDate: newEndDate })
      .where(eq(subscriptions.id, subscription.id));
  } else {
    // Expire existing subscriptions
    await db
      .update(subscriptions)
      .set({ status: "expired" })
      .where(
        and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active"))
      );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + monthsToAdd);

    await db.insert(subscriptions).values({
      userId: user.id,
      planId: plan!.id,
      paymentId: payment.id,
      startDate,
      endDate,
      status: "active",
      websitesCreatedCount: 0,
      websitesRemainingCount: plan?.websiteLimit || 0,
    });

    await db.update(users).set({ planId: plan!.id }).where(eq(users.id, user.id));
  }

  await db
    .update(payments)
    .set({ status: "approved" })
    .where(eq(payments.id, Number(id)));

  const [updatedPayment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, Number(id)));

  SuccessResponse(res, {
    message: "Payment approved successfully",
    payment: updatedPayment,
  });
};
