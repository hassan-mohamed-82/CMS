import { Request, Response } from "express";
import { db } from "../../models/connection";
import { emailVerifications } from "../../models/schema/auth/emailVerifications";
import { users } from "../../models/schema/auth/User";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import { SuccessResponse } from "../../utils/response";
import { randomInt } from "crypto";
import {
  ConflictError,
  ForbiddenError,
  NotFound,
  UnauthorizedError,
} from "../../Errors";
import { generateToken } from "../../utils/auth";
import { sendEmail } from "../../utils/sendEmails";
import { BadRequest } from "../../Errors/BadRequest";

export const signup = async (req: Request, res: Response) => {
  const data = req.body;

  // Check if user already exists
  const existingUsers = await db
    .select()
    .from(users)
    .where(or(eq(users.email, data.email), eq(users.phonenumber, data.phoneNumber)));

  const existingUser = existingUsers[0];

  if (existingUser) {
    if (existingUser.email === data.email) {
      if (!existingUser.isVerified) {
        // Delete old codes
        await db
          .delete(emailVerifications)
          .where(eq(emailVerifications.userId, existingUser.id));

        const code = randomInt(100000, 999999).toString();

        await db.insert(emailVerifications).values({
          userId: existingUser.id,
          verificationCode: code,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        await sendEmail(
          data.email,
          "Email Verification",
          `Your verification code is ${code}`
        );

        return SuccessResponse(
          res,
          {
            message: "Verification code resent successfully",
            userId: existingUser.id,
          },
          200
        );
      } else {
        throw new ConflictError("Email is already registered and verified");
      }
    }

    if (existingUser.phonenumber === data.phoneNumber) {
      throw new ConflictError("Phone Number is already used");
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create new user
  const [result] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phonenumber: data.phoneNumber,
      isVerified: false,
    })
    .$returningId();

  // Create verification code
  const code = randomInt(100000, 999999).toString();

  await db.insert(emailVerifications).values({
    userId: result.id,
    verificationCode: code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  await sendEmail(
    data.email,
    "Email Verification",
    `Your verification code is ${code}`
  );

  SuccessResponse(
    res,
    {
      message: "User Signup Successfully. Please verify your email.",
      userId: result.id,
    },
    201
  );
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({
      success: false,
      error: { code: 400, message: "userId and code are required" },
    });
  }

  const [record] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.userId, Number(userId)));

  if (!record) {
    return res.status(400).json({
      success: false,
      error: { code: 400, message: "No verification record found" },
    });
  }

  if (record.verificationCode !== code) {
    return res.status(400).json({
      success: false,
      error: { code: 400, message: "Invalid verification code" },
    });
  }

  if (record.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      error: { code: 400, message: "Verification code expired" },
    });
  }

  await db
    .update(users)
    .set({ isVerified: true })
    .where(eq(users.id, Number(userId)));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(userId)));

  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 404, message: "User not found" },
    });
  }

  // Delete verification record
  await db
    .delete(emailVerifications)
    .where(eq(emailVerifications.userId, Number(userId)));

  // Generate token
  const token = generateToken({
    id: user.id,
    name: user.name,
  });

  return res.json({
    success: true,
    message: "Email verified successfully",
    token,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!password) {
    throw new UnauthorizedError("Password is required");
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user || !user.password) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.isVerified) {
    throw new ForbiddenError("Verify your email first");
  }

  const token = generateToken({
    id: user.id,
    name: user.name,
  });

  SuccessResponse(res, { message: "Login Successful", token }, 200);
};

export const sendResetCode = async (req: Request, res: Response) => {
  const { email } = req.body;

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) throw new NotFound("User not found");
  if (!user.isVerified) throw new BadRequest("User is not verified");

  const code = randomInt(100000, 999999).toString();

  // Delete any existing code
  await db.delete(emailVerifications).where(eq(emailVerifications.userId, user.id));

  // Create new code
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  await db.insert(emailVerifications).values({
    userId: user.id,
    verificationCode: code,
    expiresAt,
  });

  await sendEmail(
    email,
    "Reset Password Code",
    `Hello ${user.name},

Your password reset code is: ${code}
(This code is valid for 2 hours)

Best regards,
Smart College Team`
  );

  SuccessResponse(res, { message: "Reset code sent to your email" }, 200);
};

export const verifyResetCode = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) throw new NotFound("User not found");

  const [record] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.userId, user.id));

  if (!record) throw new BadRequest("No reset code found");

  if (record.verificationCode !== code) throw new BadRequest("Invalid code");

  if (record.expiresAt < new Date()) throw new BadRequest("Code expired");

  SuccessResponse(res, { message: "Reset code verified successfully" }, 200);
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) throw new NotFound("User not found");

  const [record] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.userId, user.id));

  if (!record) throw new BadRequest("No reset code found");

  // Update password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, user.id));

  // Delete verification record
  await db.delete(emailVerifications).where(eq(emailVerifications.userId, user.id));

  // Generate token
  const token = generateToken({
    id: user.id,
    name: user.name,
  });

  return SuccessResponse(
    res,
    { message: "Password reset successful", token },
    200
  );
};
