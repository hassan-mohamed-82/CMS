"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = void 0;
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const connection_1 = require("../models/connection");
const User_1 = require("../models/schema/auth/User");
const drizzle_orm_1 = require("drizzle-orm");
dotenv_1.default.config();
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const verifyGoogleToken = async (req, res) => {
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
        const email = payload.email;
        const name = payload.name || "Unknown User";
        const googleId = payload.sub;
        // Find user by googleId or email
        const [existingUser] = await connection_1.db
            .select()
            .from(User_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(User_1.users.googleId, googleId), (0, drizzle_orm_1.eq)(User_1.users.email, email)));
        let userId;
        if (!existingUser) {
            // ➕ Signup (new user)
            const [result] = await connection_1.db
                .insert(User_1.users)
                .values({
                googleId,
                email,
                name,
                isVerified: true,
            })
                .$returningId();
            userId = result.id;
        }
        else {
            // 👤 Login (existing user)
            userId = existingUser.id;
            if (!existingUser.googleId) {
                await connection_1.db
                    .update(User_1.users)
                    .set({ googleId })
                    .where((0, drizzle_orm_1.eq)(User_1.users.id, existingUser.id));
            }
        }
        // 🔑 Generate JWT
        const authToken = jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
        const [user] = await connection_1.db.select().from(User_1.users).where((0, drizzle_orm_1.eq)(User_1.users.id, userId));
        return res.json({
            success: true,
            token: authToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error("Google login error:", error);
        res.status(401).json({ success: false, message: "Invalid token" });
    }
};
exports.verifyGoogleToken = verifyGoogleToken;
