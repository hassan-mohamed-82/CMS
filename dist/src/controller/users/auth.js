"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyResetCode = exports.sendResetCode = exports.login = exports.verifyEmail = exports.signup = void 0;
const connection_1 = require("../../models/connection");
const emailVerifications_1 = require("../../models/schema/auth/emailVerifications");
const User_1 = require("../../models/schema/auth/User");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const response_1 = require("../../utils/response");
const crypto_1 = require("crypto");
const Errors_1 = require("../../Errors");
const auth_1 = require("../../utils/auth");
const sendEmails_1 = require("../../utils/sendEmails");
const BadRequest_1 = require("../../Errors/BadRequest");
const signup = async (req, res) => {
    const data = req.body;
    // Check if user already exists
    const existingUsers = await connection_1.db
        .select()
        .from(User_1.users)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(User_1.users.email, data.email), (0, drizzle_orm_1.eq)(User_1.users.phonenumber, data.phoneNumber)));
    const existingUser = existingUsers[0];
    if (existingUser) {
        if (existingUser.email === data.email) {
            if (!existingUser.isVerified) {
                // Delete old codes
                await connection_1.db
                    .delete(emailVerifications_1.emailVerifications)
                    .where((0, drizzle_orm_1.eq)(emailVerifications_1.emailVerifications.userId, existingUser.id));
                const code = (0, crypto_1.randomInt)(100000, 999999).toString();
                await connection_1.db.insert(emailVerifications_1.emailVerifications).values({
                    userId: existingUser.id,
                    verificationCode: code,
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
                });
                await (0, sendEmails_1.sendEmail)(data.email, "Email Verification", `Your verification code is ${code}`);
                return (0, response_1.SuccessResponse)(res, {
                    message: "Verification code resent successfully",
                    userId: existingUser.id,
                }, 200);
            }
            else {
                throw new Errors_1.ConflictError("Email is already registered and verified");
            }
        }
        if (existingUser.phonenumber === data.phoneNumber) {
            throw new Errors_1.ConflictError("Phone Number is already used");
        }
    }
    // Hash password
    const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
    // Create new user
    const [result] = await connection_1.db
        .insert(User_1.users)
        .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phonenumber: data.phoneNumber,
        isVerified: false,
    })
        .$returningId();
    // Create verification code
    const code = (0, crypto_1.randomInt)(100000, 999999).toString();
    await connection_1.db.insert(emailVerifications_1.emailVerifications).values({
        userId: result.id,
        verificationCode: code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    await (0, sendEmails_1.sendEmail)(data.email, "Email Verification", `Your verification code is ${code}`);
    (0, response_1.SuccessResponse)(res, {
        message: "User Signup Successfully. Please verify your email.",
        userId: result.id,
    }, 201);
};
exports.signup = signup;
const verifyEmail = async (req, res) => {
    const { userId, code } = req.body;
    if (!userId || !code) {
        return res.status(400).json({
            success: false,
            error: { code: 400, message: "userId and code are required" },
        });
    }
    const [record] = await connection_1.db
        .select()
        .from(emailVerifications_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(emailVerifications_1.emailVerifications.userId, Number(userId)));
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
    await connection_1.db
        .update(User_1.users)
        .set({ isVerified: true })
        .where((0, drizzle_orm_1.eq)(User_1.users.id, Number(userId)));
    const [user] = await connection_1.db
        .select()
        .from(User_1.users)
        .where((0, drizzle_orm_1.eq)(User_1.users.id, Number(userId)));
    if (!user) {
        return res.status(404).json({
            success: false,
            error: { code: 404, message: "User not found" },
        });
    }
    // Delete verification record
    await connection_1.db
        .delete(emailVerifications_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(emailVerifications_1.emailVerifications.userId, Number(userId)));
    // Generate token
    const token = (0, auth_1.generateToken)({
        id: user.id,
        name: user.name,
    });
    return res.json({
        success: true,
        message: "Email verified successfully",
        token,
    });
};
exports.verifyEmail = verifyEmail;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!password) {
        throw new Errors_1.UnauthorizedError("Password is required");
    }
    const [user] = await connection_1.db.select().from(User_1.users).where((0, drizzle_orm_1.eq)(User_1.users.email, email));
    if (!user || !user.password) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    if (!user.isVerified) {
        throw new Errors_1.ForbiddenError("Verify your email first");
    }
    const token = (0, auth_1.generateToken)({
        id: user.id,
        name: user.name,
    });
    (0, response_1.SuccessResponse)(res, { message: "Login Successful", token }, 200);
};
exports.login = login;
const sendResetCode = async (req, res) => {
    const { email } = req.body;
    const [user] = await connection_1.db.select().from(User_1.users).where((0, drizzle_orm_1.eq)(User_1.users.email, email));
    if (!user)
        throw new Errors_1.NotFound("User not found");
    if (!user.isVerified)
        throw new BadRequest_1.BadRequest("User is not verified");
    const code = (0, crypto_1.randomInt)(100000, 999999).toString();
    // Delete any existing code
    await connection_1.db.delete(emailVerifications_1.emailVerifications).where((0, drizzle_orm_1.eq)(emailVerifications_1.emailVerifications.userId, user.id));
    // Create new code
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    await connection_1.db.insert(emailVerifications_1.emailVerifications).values({
        userId: user.id,
        verificationCode: code,
        expiresAt,
    });
    await (0, sendEmails_1.sendEmail)(email, "Reset Password Code", `Hello ${user.name},

Your password reset code is: ${code}
(This code is valid for 2 hours)

Best regards,
Smart College Team`);
    (0, response_1.SuccessResponse)(res, { message: "Reset code sent to your email" }, 200);
};
exports.sendResetCode = sendResetCode;
const verifyResetCode = async (req, res) => {
    const { email, code } = req.body;
    const [user] = await connection_1.db.select().from(User_1.users).where((0, drizzle_orm_1.eq)(User_1.users.email, email));
    if (!user)
        throw new Errors_1.NotFound("User not found");
    const [record] = await connection_1.db
        .select()
        .from(emailVerifications_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(emailVerifications_1.emailVerifications.userId, user.id));
    if (!record)
        throw new BadRequest_1.BadRequest("No reset code found");
    if (record.verificationCode !== code)
        throw new BadRequest_1.BadRequest("Invalid code");
    if (record.expiresAt < new Date())
        throw new BadRequest_1.BadRequest("Code expired");
    (0, response_1.SuccessResponse)(res, { message: "Reset code verified successfully" }, 200);
};
exports.verifyResetCode = verifyResetCode;
const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    const [user] = await connection_1.db.select().from(User_1.users).where((0, drizzle_orm_1.eq)(User_1.users.email, email));
    if (!user)
        throw new Errors_1.NotFound("User not found");
    const [record] = await connection_1.db
        .select()
        .from(emailVerifications_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(emailVerifications_1.emailVerifications.userId, user.id));
    if (!record)
        throw new BadRequest_1.BadRequest("No reset code found");
    // Update password
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    await connection_1.db
        .update(User_1.users)
        .set({ password: hashedPassword })
        .where((0, drizzle_orm_1.eq)(User_1.users.id, user.id));
    // Delete verification record
    await connection_1.db.delete(emailVerifications_1.emailVerifications).where((0, drizzle_orm_1.eq)(emailVerifications_1.emailVerifications.userId, user.id));
    // Generate token
    const token = (0, auth_1.generateToken)({
        id: user.id,
        name: user.name,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Password reset successful", token }, 200);
};
exports.resetPassword = resetPassword;
