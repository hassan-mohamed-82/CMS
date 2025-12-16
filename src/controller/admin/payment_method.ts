import { Request, Response } from "express";
import { db } from "../../models/connection";
import { paymentMethods } from "../../models/schema/payment_methods";
// Renamed 'eq' import to avoid conflict with local declaration (per lint error)
import { eq as drizzleEq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

export const createPaymentMethod = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin") {
    throw new UnauthorizedError("Access denied");
  }

  const { name, discription } = req.body;
  if (!name || !discription) {
    throw new BadRequest("Please provide all the required fields");
  }

  if (!req.file) {
    throw new BadRequest("Logo file is required");
  }

  const logoUrl = `${req.protocol}://${req.get("host")}/uploads/payment_logos/${req.file.filename}`;

  const [result] = await db
    .insert(paymentMethods)
    .values({
      name,
      description: discription,
      logoUrl,
      isActive: true,
    })
    .$returningId();

  const [paymentMethod] = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, result.id));

  SuccessResponse(res, {
    message: "Payment method created successfully",
    paymentMethod,
  });
};

export const getAllPaymentMethods = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const allPaymentMethods = await db.select().from(paymentMethods);

  if (!allPaymentMethods || allPaymentMethods.length === 0)
    throw new NotFound("No payment methods found");

  SuccessResponse(res, {
    message: "All payment methods fetched successfully",
    paymentMethods: allPaymentMethods,
  });
};

export const getPaymentMethodById = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

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

export const updatePaymentMethod = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide payment method id");

  const [existingMethod] = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, Number(id)));

  if (!existingMethod) throw new NotFound("Payment method not found");

  const updateData: Partial<typeof paymentMethods.$inferInsert> = {};
  if (req.body.name) updateData.name = req.body.name;
  if (req.body.discription) updateData.description = req.body.discription;
  if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

  if (req.file) {
    updateData.logoUrl = `${req.protocol}://${req.get("host")}/uploads/payment_logos/${req.file.filename}`;
  }

  await db
    .update(paymentMethods)
    .set(updateData)
    .where(eq(paymentMethods.id, Number(id)));

  const [paymentMethod] = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, Number(id)));

  SuccessResponse(res, {
    message: "Payment method updated successfully",
    paymentMethod,
  });
};

export const deletePaymentMethod = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide payment method id");

  const [paymentMethod] = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, Number(id)));

  if (!paymentMethod) throw new NotFound("Payment method not found");

  await db.delete(paymentMethods).where(eq(paymentMethods.id, Number(id)));

  SuccessResponse(res, { message: "Payment method deleted successfully" });
};
function eq(id: any, arg1: number): any {
  throw new Error("Function not implemented.");
}

