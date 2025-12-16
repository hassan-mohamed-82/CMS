// controllers/authController.ts
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { db } from "../models/connection";
import { users } from "../models/schema/auth/User";
import { eq, or } from "drizzle-orm";

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ success: false, message: "Invalid Google payload" });
    }

    const email = payload.email!;
    const name = payload.name || "Unknown User";
    const googleId = payload.sub;

    // Find user by googleId or email
    const [existingUser] = await db
      .select()
      .from(users)
      .where(or(eq(users.googleId, googleId), eq(users.email, email)));

    let userId: number;

    if (!existingUser) {
      // ➕ Signup (new user)
      const [result] = await db
        .insert(users)
        .values({
          googleId,
          email,
          name,
          isVerified: true,
        })
        .$returningId();

      userId = result.id;
    } else {
      // 👤 Login (existing user)
      userId = existingUser.id;

      if (!existingUser.googleId) {
        await db
          .update(users)
          .set({ googleId })
          .where(eq(users.id, existingUser.id));
      }
    }

    // 🔑 Generate JWT
    const authToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    return res.json({
      success: true,
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
