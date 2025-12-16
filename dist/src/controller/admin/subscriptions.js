"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionById = exports.getAllSubscription = void 0;
const connection_1 = require("../../models/connection");
const subscriptions_1 = require("../../models/schema/subscriptions");
const User_1 = require("../../models/schema/auth/User");
const plans_1 = require("../../models/schema/plans");
const payments_1 = require("../../models/schema/payments");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const getAllSubscription = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("access denied");
    const allSubscriptions = await connection_1.db
        .select({
        subscription: subscriptions_1.subscriptions,
        user: User_1.users,
        plan: plans_1.plans,
        payment: payments_1.payments,
    })
        .from(subscriptions_1.subscriptions)
        .leftJoin(User_1.users, (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.userId, User_1.users.id))
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.planId, plans_1.plans.id))
        .leftJoin(payments_1.payments, (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.paymentId, payments_1.payments.id));
    const formattedData = allSubscriptions.map((item) => ({
        ...item.subscription,
        userId: item.user,
        planId: item.plan,
        PaymentId: item.payment,
    }));
    if (!formattedData || formattedData.length === 0)
        throw new NotFound_1.NotFound("No subscription found");
    (0, response_1.SuccessResponse)(res, {
        message: "All subscription fetched successfully",
        data: formattedData,
    });
};
exports.getAllSubscription = getAllSubscription;
const getSubscriptionById = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide subscription id");
    const [result] = await connection_1.db
        .select({
        subscription: subscriptions_1.subscriptions,
        user: User_1.users,
        plan: plans_1.plans,
        payment: payments_1.payments,
    })
        .from(subscriptions_1.subscriptions)
        .leftJoin(User_1.users, (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.userId, User_1.users.id))
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.planId, plans_1.plans.id))
        .leftJoin(payments_1.payments, (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.paymentId, payments_1.payments.id))
        .where((0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.id, Number(id)));
    if (!result)
        throw new NotFound_1.NotFound("Subscription not found");
    const data = {
        ...result.subscription,
        userId: result.user,
        planId: result.plan,
        PaymentId: result.payment,
    };
    (0, response_1.SuccessResponse)(res, { message: "Subscription fetched successfully", data });
};
exports.getSubscriptionById = getSubscriptionById;
