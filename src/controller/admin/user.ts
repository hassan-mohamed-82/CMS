import { Request, Response } from "express";
import { db } from "../../models/connection";
import { users } from "../../models/schema/auth/User";
import { plans } from "../../models/schema/plans";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";
import bcrypt from "bcrypt";

export const createUser = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { name, email, password, phonenumber } = req.body;

  if (!password) {
    throw new BadRequest("Password is required");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const [result] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      phonenumber,
    })
    .$returningId();

  const [user] = await db.select().from(users).where(eq(users.id, result.id));

  SuccessResponse(res, {
    message: "User created successfully",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
};

export const getUserById = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin") {
    throw new UnauthorizedError("Access denied");
  }

  const { id } = req.params;

  const [result] = await db
    .select({
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phonenumber: users.phonenumber,
        isVerified: users.isVerified,
        googleId: users.googleId,
        planId: users.planId,
        firstTimeBuyer: users.firstTimeBuyer,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      },
      plan: {
        id: plans.id,
        name: plans.name,
      },
    })
    .from(users)
    .leftJoin(plans, eq(users.planId, plans.id))
    .where(eq(users.id, Number(id)));

  if (!result) {
    throw new NotFound("User not found");
  }

  const user = {
    ...result.user,
    planId: result.plan,
  };

  SuccessResponse(res, { message: "User details", user });
};

export const updateUser = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin") {
    throw new UnauthorizedError("Access denied");
  }

  const { id } = req.params;
  const { name, email, password, phonenumber } = req.body;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(id)));

  if (!existingUser) {
    throw new NotFound("User not found");
  }

  const updateData: Partial<typeof users.$inferInsert> = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phonenumber) updateData.phonenumber = phonenumber;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  await db.update(users).set(updateData).where(eq(users.id, Number(id)));

  SuccessResponse(res, { message: "User updated successfully" });
};

export const deleteUser = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin") {
    throw new UnauthorizedError("Access denied");
  }

  const { id } = req.params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(id)));

  if (!user) {
    throw new NotFound("User not found");
  }

  await db.delete(users).where(eq(users.id, Number(id)));

  SuccessResponse(res, { message: "User deleted successfully" });
};

export const getAllUsers = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin") {
    throw new UnauthorizedError("Access denied");
  }

  const allUsers = await db
    .select({
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phonenumber: users.phonenumber,
        isVerified: users.isVerified,
        googleId: users.googleId,
        planId: users.planId,
        firstTimeBuyer: users.firstTimeBuyer,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      },
      plan: {
        id: plans.id,
        name: plans.name,
      },
    })
    .from(users)
    .leftJoin(plans, eq(users.planId, plans.id));

  const formattedUsers = allUsers.map((item) => ({
    ...item.user,
    planId: item.plan,
  }));

  SuccessResponse(res, { message: "Users fetched successfully", users: formattedUsers });
};
