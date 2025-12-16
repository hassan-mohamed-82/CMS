import { Request, Response } from "express";
import { db } from "../../models/connection";
import { plans } from "../../models/schema/plans";
import { payments } from "../../models/schema/payments";
import { paymentMethods } from "../../models/schema/payment_methods";
import { promoCodes } from "../../models/schema/promo_code";
import { promocodePlans } from "../../models/schema/promocode_plans";
import { promocodeUsers } from "../../models/schema/promocode_users";
import { eq, and, lte, gte } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

export const createPayment = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User is not authenticated");

  const userId = req.user.id;
  const { plan_id, paymentmethod_id, amount, code, subscriptionType } = req.body;

  if (!amount || !paymentmethod_id || !plan_id) {
    throw new BadRequest("Please provide all the required fields");
  }

  const planId = Number(plan_id);
  const paymentMethodId = Number(paymentmethod_id);

  if (isNaN(planId)) throw new BadRequest("Invalid plan ID");
  if (isNaN(paymentMethodId)) throw new BadRequest("Invalid payment method ID");

  const [plan] = await db.select().from(plans).where(eq(plans.id, planId));

  if (!plan) throw new NotFound("Plan not found");

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new BadRequest("Amount must be a positive number");
  }

  const validAmounts = [
    plan.priceMonthly ? Number(plan.priceMonthly) : null,
    plan.priceQuarterly ? Number(plan.priceQuarterly) : null,
    plan.priceSemiAnnually ? Number(plan.priceSemiAnnually) : null,
    plan.priceAnnually ? Number(plan.priceAnnually) : null,
  ].filter((price) => price != null);

  if (!validAmounts.includes(parsedAmount)) {
    throw new BadRequest("Invalid payment amount for this plan");
  }

  // Calculate discount if code exists
  let discountAmount = 0;
  if (code) {
    const today = new Date();
    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(
        and(
          eq(promoCodes.code, code),
          eq(promoCodes.isActive, true),
          lte(promoCodes.startDate, today),
          gte(promoCodes.endDate, today)
        )
      );

    if (!promo) throw new BadRequest("Invalid or expired promo code");

    const [alreadyUsed] = await db
      .select()
      .from(promocodeUsers)
      .where(
        and(
          eq(promocodeUsers.userId, Number(userId)),
          eq(promocodeUsers.codeId, promo.id)
        )
      );

    if (alreadyUsed) throw new BadRequest("You have already used this promo code");

    type SubscriptionType = "monthly" | "quarterly" | "semi_annually" | "yearly";
    const validSubscriptionTypes: SubscriptionType[] = [
      "monthly",
      "quarterly",
      "semi_annually",
      "yearly",
    ];
    if (!validSubscriptionTypes.includes(subscriptionType)) {
      throw new BadRequest("Invalid subscription type");
    }

    const [promoPlan] = await db
      .select()
      .from(promocodePlans)
      .where(
        and(
          eq(promocodePlans.codeId, promo.id),
          eq(promocodePlans.planId, plan.id)
        )
      );

    if (!promoPlan) throw new BadRequest("Promo code does not apply to this plan");

    // Check if promo applies to subscription type
    const appliesToMap: Record<SubscriptionType, boolean | null> = {
      monthly: promoPlan.appliesToMonthly,
      quarterly: promoPlan.appliesToQuarterly,
      semi_annually: promoPlan.appliesToSemiAnnually,
      yearly: promoPlan.appliesToYearly,
    };

    if (!appliesToMap[subscriptionType as SubscriptionType]) {
      throw new BadRequest("Promo code does not apply to this plan/subscription type");
    }

    if (promo.discountType === "percentage") {
      discountAmount = (parsedAmount * Number(promo.discountValue)) / 100;
    } else {
      discountAmount = Number(promo.discountValue);
    }

    await db.insert(promocodeUsers).values({
      userId: Number(userId),
      codeId: promo.id,
    });
  }

  const finalAmount = parsedAmount - discountAmount;
  if (finalAmount <= 0)
    throw new BadRequest("Invalid payment amount after applying promo code");

  // Build photo URL if uploaded
  let photoUrl: string | undefined;
  if (req.file) {
    photoUrl = `${req.protocol}://${req.get("host")}/uploads/payments/${req.file.filename}`;
  }

  const [result] = await db
    .insert(payments)
    .values({
      amount: String(finalAmount),
      paymentMethodId,
      planId,
      paymentDate: new Date(),
      userId: Number(userId),
      status: "pending",
      code,
      photo: photoUrl || "",
      subscriptionType,
    })
    .$returningId();

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, result.id));

  SuccessResponse(res, {
    message: "Payment created successfully. Promo code applied (if valid).",
    payment,
    discountAmount,
  });
};

export const getAllPayments = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("user is not authenticated");

  const allPayments = await db
    .select({
      payment: payments,
      plan: plans,
      paymentMethod: paymentMethods,
    })
    .from(payments)
    .leftJoin(plans, eq(payments.planId, plans.id))
    .leftJoin(paymentMethods, eq(payments.paymentMethodId, paymentMethods.id))
    .where(eq(payments.userId, Number(req.user.id)));

  const formattedPayments = allPayments.map((p) => ({
    ...p.payment,
    paymentmethod_id: p.paymentMethod,
    plan_id: p.plan,
  }));

  const pending = formattedPayments.filter((p) => p.status === "pending");
  const history = formattedPayments.filter((p) =>
    ["approved", "rejected"].includes(p.status || "")
  );

  SuccessResponse(res, {
    message: "All payments fetched successfully",
    payments: {
      pending,
      history,
    },
  });
};

export const getPaymentById = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("user is not authenticated");

  const userId = req.user.id;
  const { id } = req.params;

  if (!id) throw new BadRequest("Please provide payment id");

  const [result] = await db
    .select({
      payment: payments,
      plan: plans,
      paymentMethod: paymentMethods,
    })
    .from(payments)
    .leftJoin(plans, eq(payments.planId, plans.id))
    .leftJoin(paymentMethods, eq(payments.paymentMethodId, paymentMethods.id))
    .where(
      and(eq(payments.id, Number(id)), eq(payments.userId, Number(userId)))
    );

  if (!result) throw new NotFound("Payment not found");

  const payment = {
    ...result.payment,
    paymentmethod_id: result.paymentMethod,
    plan_id: result.plan,
  };

  SuccessResponse(res, { message: "Payment fetched successfully", payment });
};
