"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.deleteUser = exports.updateUser = exports.getUserById = exports.createUser = void 0;
const connection_1 = require("../../models/connection");
const User_1 = require("../../models/schema/auth/User");
const plans_1 = require("../../models/schema/plans");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const bcrypt_1 = __importDefault(require("bcrypt"));
const createUser = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { name, email, password, phonenumber } = req.body;
    if (!password) {
        throw new BadRequest_1.BadRequest("Password is required");
    }
    const salt = await bcrypt_1.default.genSalt(10);
    const hashedPassword = await bcrypt_1.default.hash(password, salt);
    const [result] = await connection_1.db
        .insert(User_1.users)
        .values({
        name,
        email,
        password: hashedPassword,
        phonenumber,
    })
        .$returningId();
    const [user] = await connection_1.db.select().from(User_1.users).where((0, drizzle_orm_1.eq)(User_1.users.id, result.id));
    (0, response_1.SuccessResponse)(res, {
        message: "User created successfully",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    });
};
exports.createUser = createUser;
const getUserById = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    }
    const { id } = req.params;
    const [result] = await connection_1.db
        .select({
        user: {
            id: User_1.users.id,
            name: User_1.users.name,
            email: User_1.users.email,
            phonenumber: User_1.users.phonenumber,
            isVerified: User_1.users.isVerified,
            googleId: User_1.users.googleId,
            planId: User_1.users.planId,
            firstTimeBuyer: User_1.users.firstTimeBuyer,
            createdAt: User_1.users.createdAt,
            updatedAt: User_1.users.updatedAt,
        },
        plan: {
            id: plans_1.plans.id,
            name: plans_1.plans.name,
        },
    })
        .from(User_1.users)
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(User_1.users.planId, plans_1.plans.id))
        .where((0, drizzle_orm_1.eq)(User_1.users.id, Number(id)));
    if (!result) {
        throw new NotFound_1.NotFound("User not found");
    }
    const user = {
        ...result.user,
        planId: result.plan,
    };
    (0, response_1.SuccessResponse)(res, { message: "User details", user });
};
exports.getUserById = getUserById;
const updateUser = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    }
    const { id } = req.params;
    const { name, email, password, phonenumber } = req.body;
    const [existingUser] = await connection_1.db
        .select()
        .from(User_1.users)
        .where((0, drizzle_orm_1.eq)(User_1.users.id, Number(id)));
    if (!existingUser) {
        throw new NotFound_1.NotFound("User not found");
    }
    const updateData = {};
    if (name)
        updateData.name = name;
    if (email)
        updateData.email = email;
    if (phonenumber)
        updateData.phonenumber = phonenumber;
    if (password) {
        const salt = await bcrypt_1.default.genSalt(10);
        updateData.password = await bcrypt_1.default.hash(password, salt);
    }
    await connection_1.db.update(User_1.users).set(updateData).where((0, drizzle_orm_1.eq)(User_1.users.id, Number(id)));
    (0, response_1.SuccessResponse)(res, { message: "User updated successfully" });
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    }
    const { id } = req.params;
    const [user] = await connection_1.db
        .select()
        .from(User_1.users)
        .where((0, drizzle_orm_1.eq)(User_1.users.id, Number(id)));
    if (!user) {
        throw new NotFound_1.NotFound("User not found");
    }
    await connection_1.db.delete(User_1.users).where((0, drizzle_orm_1.eq)(User_1.users.id, Number(id)));
    (0, response_1.SuccessResponse)(res, { message: "User deleted successfully" });
};
exports.deleteUser = deleteUser;
const getAllUsers = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    }
    const allUsers = await connection_1.db
        .select({
        user: {
            id: User_1.users.id,
            name: User_1.users.name,
            email: User_1.users.email,
            phonenumber: User_1.users.phonenumber,
            isVerified: User_1.users.isVerified,
            googleId: User_1.users.googleId,
            planId: User_1.users.planId,
            firstTimeBuyer: User_1.users.firstTimeBuyer,
            createdAt: User_1.users.createdAt,
            updatedAt: User_1.users.updatedAt,
        },
        plan: {
            id: plans_1.plans.id,
            name: plans_1.plans.name,
        },
    })
        .from(User_1.users)
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(User_1.users.planId, plans_1.plans.id));
    const formattedUsers = allUsers.map((item) => ({
        ...item.user,
        planId: item.plan,
    }));
    (0, response_1.SuccessResponse)(res, { message: "Users fetched successfully", users: formattedUsers });
};
exports.getAllUsers = getAllUsers;
