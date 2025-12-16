"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPromoCodeUserById = exports.getPromoCodeUser = void 0;
const connection_1 = require("../../models/connection");
const promocode_users_1 = require("../../models/schema/promocode_users");
const User_1 = require("../../models/schema/auth/User");
const promo_code_1 = require("../../models/schema/promo_code");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const getPromoCodeUser = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("access denied");
    const allPromocodeUsers = await connection_1.db
        .select({
        promocodeUser: promocode_users_1.promocodeUsers,
        user: {
            id: User_1.users.id,
            name: User_1.users.name,
            email: User_1.users.email,
        },
        code: promo_code_1.promoCodes,
    })
        .from(promocode_users_1.promocodeUsers)
        .leftJoin(User_1.users, (0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.userId, User_1.users.id))
        .leftJoin(promo_code_1.promoCodes, (0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.codeId, promo_code_1.promoCodes.id));
    const formattedData = allPromocodeUsers.map((item) => ({
        ...item.promocodeUser,
        userId: item.user,
        codeId: item.code,
    }));
    if (!formattedData || formattedData.length === 0)
        throw new NotFound_1.NotFound("Promocode not found");
    (0, response_1.SuccessResponse)(res, {
        message: "Promocode found successfully",
        promocode: formattedData,
    });
};
exports.getPromoCodeUser = getPromoCodeUser;
const getPromoCodeUserById = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide promocode id");
    const [result] = await connection_1.db
        .select({
        promocodeUser: promocode_users_1.promocodeUsers,
        user: {
            id: User_1.users.id,
            name: User_1.users.name,
            email: User_1.users.email,
        },
        code: promo_code_1.promoCodes,
    })
        .from(promocode_users_1.promocodeUsers)
        .leftJoin(User_1.users, (0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.userId, User_1.users.id))
        .leftJoin(promo_code_1.promoCodes, (0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.codeId, promo_code_1.promoCodes.id))
        .where((0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.id, Number(id)));
    if (!result)
        throw new NotFound_1.NotFound("Promocode not found");
    const promocode = {
        ...result.promocodeUser,
        userId: result.user,
        codeId: result.code,
    };
    (0, response_1.SuccessResponse)(res, { message: "Promocode found successfully", promocode });
};
exports.getPromoCodeUserById = getPromoCodeUserById;
