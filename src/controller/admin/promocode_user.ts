import { Request, Response } from "express";
import { db } from "../../models/connection";
import { promocodeUsers } from "../../models/schema/promocode_users";
import { users } from "../../models/schema/auth/User";
import { promoCodes } from "../../models/schema/promo_code";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

export const getPromoCodeUser = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("access denied");

  const allPromocodeUsers = await db
    .select({
      promocodeUser: promocodeUsers,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      code: promoCodes,
    })
    .from(promocodeUsers)
    .leftJoin(users, eq(promocodeUsers.userId, users.id))
    .leftJoin(promoCodes, eq(promocodeUsers.codeId, promoCodes.id));

  const formattedData = allPromocodeUsers.map((item) => ({
    ...item.promocodeUser,
    userId: item.user,
    codeId: item.code,
  }));

  if (!formattedData || formattedData.length === 0)
    throw new NotFound("Promocode not found");

  SuccessResponse(res, {
    message: "Promocode found successfully",
    promocode: formattedData,
  });
};

export const getPromoCodeUserById = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide promocode id");

  const [result] = await db
    .select({
      promocodeUser: promocodeUsers,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      code: promoCodes,
    })
    .from(promocodeUsers)
    .leftJoin(users, eq(promocodeUsers.userId, users.id))
    .leftJoin(promoCodes, eq(promocodeUsers.codeId, promoCodes.id))
    .where(eq(promocodeUsers.id, Number(id)));

  if (!result) throw new NotFound("Promocode not found");

  const promocode = {
    ...result.promocodeUser,
    userId: result.user,
    codeId: result.code,
  };

  SuccessResponse(res, { message: "Promocode found successfully", promocode });
};
