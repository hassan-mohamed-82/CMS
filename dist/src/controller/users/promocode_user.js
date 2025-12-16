"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPromoCodeUserById = exports.getPromoCodeUser = void 0;
const connection_1 = require("../../models/connection");
const promocode_users_1 = require("../../models/schema/promocode_users");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const getPromoCodeUser = async (req, res) => {
    if (!req.user)
        throw new unauthorizedError_1.UnauthorizedError("User not authenticated");
    const userId = req.user.id;
    const [promocode] = await connection_1.db
        .select()
        .from(promocode_users_1.promocodeUsers)
        .where((0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.userId, Number(userId)));
    if (!promocode)
        throw new NotFound_1.NotFound("Promocode not found");
    (0, response_1.SuccessResponse)(res, { message: "Promocode found successfully", promocode });
};
exports.getPromoCodeUser = getPromoCodeUser;
const getPromoCodeUserById = async (req, res) => {
    if (!req.user)
        throw new unauthorizedError_1.UnauthorizedError("User not authenticated");
    const userId = req.user.id;
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide promocode id");
    const [promocode] = await connection_1.db
        .select()
        .from(promocode_users_1.promocodeUsers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.userId, Number(userId)), (0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.id, Number(id))));
    if (!promocode)
        throw new NotFound_1.NotFound("Promocode not found");
    (0, response_1.SuccessResponse)(res, { message: "Promocode found successfully", promocode });
};
exports.getPromoCodeUserById = getPromoCodeUserById;
