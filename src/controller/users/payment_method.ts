import { Request, Response } from "express";
import { db } from "../../models/connection";
import { paymentMethods } from "../../models/schema/payment_methods";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

export const getAllPaymentMethods = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const allPaymentMethods = await db.select().from(paymentMethods);

  if (!allPaymentMethods || allPaymentMethods.length === 0)
    throw new NotFound("No payment methods found");

  SuccessResponse(res, {
    message: "All payment methods fetched successfully",
    paymentMethods: allPaymentMethods,
  });
};

export const getPaymentMethodById = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide payment method id");

  const [paymentMethod] = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, Number(id)));

  if (!paymentMethod) throw new NotFound("Payment method not found");

  SuccessResponse(res, {
    message: "Payment method fetched successfully",
    paymentMethod,
  });
};
