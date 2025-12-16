import { Request, Response } from "express";
import { db } from "../../models/connection";
import { admins } from "../../models/schema/auth/Admin";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { generateToken } from "../../utils/auth";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new UnauthorizedError("Email and password are required");
  }

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (!admin) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, admin.hashedPassword);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = generateToken({
    id: admin.id,
    name: admin.name,
    role: "admin",
  });

  SuccessResponse(res, { message: "login Successful", token: token }, 200);
};
