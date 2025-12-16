"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionById = exports.getAllSubscriptions = void 0;
const connection_1 = require("../../models/connection");
const subscriptions_1 = require("../../models/schema/subscriptions");
const plans_1 = require("../../models/schema/plans");
const payments_1 = require("../../models/schema/payments");
const drizzle_orm_1 = require("drizzle-orm");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const getAllSubscriptions = async (req, res) => {
    if (!req.user)
        throw new unauthorizedError_1.UnauthorizedError("User not authenticated");
    const userId = req.user.id;
    const allSubscriptions = await connection_1.db
        .select({
        subscription: subscriptions_1.subscriptions,
        plan: plans_1.plans,
        payment: payments_1.payments,
    })
        .from(subscriptions_1.subscriptions)
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.planId, plans_1.plans.id))
        .leftJoin(payments_1.payments, (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.paymentId, payments_1.payments.id))
        .where((0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.userId, Number(userId)));
    const formattedSubscriptions = allSubscriptions.map((item) => ({
        ...item.subscription,
        planId: item.plan,
        PaymentId: item.payment,
    }));
    if (!formattedSubscriptions || formattedSubscriptions.length === 0)
        throw new NotFound_1.NotFound("No subscriptions found");
    (0, response_1.SuccessResponse)(res, {
        message: "All subscriptions fetched successfully",
        subscriptions: formattedSubscriptions,
    });
};
exports.getAllSubscriptions = getAllSubscriptions;
const getSubscriptionById = async (req, res) => {
    if (!req.user)
        throw new unauthorizedError_1.UnauthorizedError("User not authenticated");
    const { id } = req.params;
    const [result] = await connection_1.db
        .select({
        subscription: subscriptions_1.subscriptions,
        plan: plans_1.plans,
        payment: payments_1.payments,
    })
        .from(subscriptions_1.subscriptions)
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.planId, plans_1.plans.id))
        .leftJoin(payments_1.payments, (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.paymentId, payments_1.payments.id))
        .where((0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.id, Number(id)));
    if (!result)
        throw new NotFound_1.NotFound("Subscription not found");
    const subscription = {
        ...result.subscription,
        planId: result.plan,
        PaymentId: result.payment,
    };
    (0, response_1.SuccessResponse)(res, {
        message: "Subscription fetched successfully",
        subscription,
    });
};
exports.getSubscriptionById = getSubscriptionById;
