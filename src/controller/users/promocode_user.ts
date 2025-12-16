import { Request, Response } from "express";
import { db } from "../../models/connection";
import { promocodeUsers } from "../../models/schema/promocode_users";
import { eq, and } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

export const getPromoCodeUser = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const userId = req.user.id;

  const [promocode] = await db
    .select()
    .from(promocodeUsers)
    .where(eq(promocodeUsers.userId, Number(userId)));

  if (!promocode) throw new NotFound("Promocode not found");

  SuccessResponse(res, { message: "Promocode found successfully", promocode });
};

export const getPromoCodeUserById = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const userId = req.user.id;
  const { id } = req.params;

  if (!id) throw new BadRequest("Please provide promocode id");

  const [promocode] = await db
    .select()
    .from(promocodeUsers)
    .where(
      and(
        eq(promocodeUsers.userId, Number(userId)),
        eq(promocodeUsers.id, Number(id))
      )
    );

  if (!promocode) throw new NotFound("Promocode not found");

  SuccessResponse(res, { message: "Promocode found successfully", promocode });
};
