"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePayment = exports.getPaymentByIdAdmin = exports.getAllPaymentsAdmin = void 0;
const connection_1 = require("../../models/connection");
const payments_1 = require("../../models/schema/payments");
const User_1 = require("../../models/schema/auth/User");
const plans_1 = require("../../models/schema/plans");
const payment_methods_1 = require("../../models/schema/payment_methods");
const subscriptions_1 = require("../../models/schema/subscriptions");
const promo_code_1 = require("../../models/schema/promo_code");
const promocode_users_1 = require("../../models/schema/promocode_users");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const getAllPaymentsAdmin = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const allPayments = await connection_1.db
        .select({
        payment: payments_1.payments,
        user: {
            id: User_1.users.id,
            name: User_1.users.name,
            email: User_1.users.email,
        },
        plan: plans_1.plans,
        paymentMethod: payment_methods_1.paymentMethods,
    })
        .from(payments_1.payments)
        .leftJoin(User_1.users, (0, drizzle_orm_1.eq)(payments_1.payments.userId, User_1.users.id))
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(payments_1.payments.planId, plans_1.plans.id))
        .leftJoin(payment_methods_1.paymentMethods, (0, drizzle_orm_1.eq)(payments_1.payments.paymentMethodId, payment_methods_1.paymentMethods.id));
    const formattedPayments = allPayments.map((p) => ({
        ...p.payment,
        userId: p.user,
        plan_id: p.plan,
        paymentmethod_id: p.paymentMethod,
    }));
    const pending = formattedPayments.filter((p) => p.status === "pending");
    const history = formattedPayments.filter((p) => ["approved", "rejected"].includes(p.status || ""));
    (0, response_1.SuccessResponse)(res, {
        message: "All payments fetched successfully (admin)",
        payments: {
            pending,
            history,
        },
    });
};
exports.getAllPaymentsAdmin = getAllPaymentsAdmin;
const getPaymentByIdAdmin = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide payment id");
    const [result] = await connection_1.db
        .select({
        payment: payments_1.payments,
        user: {
            id: User_1.users.id,
            name: User_1.users.name,
            email: User_1.users.email,
        },
        plan: plans_1.plans,
        paymentMethod: payment_methods_1.paymentMethods,
    })
        .from(payments_1.payments)
        .leftJoin(User_1.users, (0, drizzle_orm_1.eq)(payments_1.payments.userId, User_1.users.id))
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(payments_1.payments.planId, plans_1.plans.id))
        .leftJoin(payment_methods_1.paymentMethods, (0, drizzle_orm_1.eq)(payments_1.payments.paymentMethodId, payment_methods_1.paymentMethods.id))
        .where((0, drizzle_orm_1.eq)(payments_1.payments.id, Number(id)));
    if (!result)
        throw new NotFound_1.NotFound("Payment not found");
    const payment = {
        ...result.payment,
        userId: result.user,
        plan_id: result.plan,
        paymentmethod_id: result.paymentMethod,
    };
    (0, response_1.SuccessResponse)(res, {
        message: "Payment fetched successfully (admin)",
        payment,
    });
};
exports.getPaymentByIdAdmin = getPaymentByIdAdmin;
const updatePayment = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    const { status, rejected_reason } = req.body;
    if (!["approved", "rejected"].includes(status)) {
        throw new BadRequest_1.BadRequest("Status must be either approved or rejected");
    }
    const [paymentResult] = await connection_1.db
        .select({
        payment: payments_1.payments,
        plan: plans_1.plans,
    })
        .from(payments_1.payments)
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(payments_1.payments.planId, plans_1.plans.id))
        .where((0, drizzle_orm_1.eq)(payments_1.payments.id, Number(id)));
    if (!paymentResult)
        throw new NotFound_1.NotFound("Payment not found");
    const payment = paymentResult.payment;
    const plan = paymentResult.plan;
    // Update payment status
    if (status === "rejected") {
        await connection_1.db
            .update(payments_1.payments)
            .set({
            status: "rejected",
            rejectedReason: rejected_reason || "No reason provided",
        })
            .where((0, drizzle_orm_1.eq)(payments_1.payments.id, Number(id)));
        const [updatedPayment] = await connection_1.db
            .select()
            .from(payments_1.payments)
            .where((0, drizzle_orm_1.eq)(payments_1.payments.id, Number(id)));
        return (0, response_1.SuccessResponse)(res, {
            message: "Payment rejected",
            payment: updatedPayment,
        });
    }
    // For approved status
    const [user] = await connection_1.db
        .select()
        .from(User_1.users)
        .where((0, drizzle_orm_1.eq)(User_1.users.id, payment.userId));
    if (!user)
        throw new NotFound_1.NotFound("User not found");
    // Check Promo Code
    if (payment.code) {
        const now = new Date();
        const [promo] = await connection_1.db
            .select()
            .from(promo_code_1.promoCodes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(promo_code_1.promoCodes.code, payment.code), (0, drizzle_orm_1.eq)(promo_code_1.promoCodes.isActive, true), (0, drizzle_orm_1.lte)(promo_code_1.promoCodes.startDate, now), (0, drizzle_orm_1.gte)(promo_code_1.promoCodes.endDate, now), (0, drizzle_orm_1.gt)(promo_code_1.promoCodes.availableUsers, 0)));
        if (promo) {
            await connection_1.db
                .update(promo_code_1.promoCodes)
                .set({ availableUsers: (promo.availableUsers || 0) - 1 })
                .where((0, drizzle_orm_1.eq)(promo_code_1.promoCodes.id, promo.id));
            const [alreadyUsed] = await connection_1.db
                .select()
                .from(promocode_users_1.promocodeUsers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.userId, user.id), (0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.codeId, promo.id)));
            if (!alreadyUsed) {
                await connection_1.db.insert(promocode_users_1.promocodeUsers).values({
                    userId: user.id,
                    codeId: promo.id,
                });
            }
        }
    }
    let monthsToAdd = 0;
    const subscriptionType = payment.subscriptionType || "quarterly";
    switch (subscriptionType) {
        case "monthly":
            monthsToAdd = 1;
            break;
        case "quarterly":
            monthsToAdd = 3;
            break;
        case "semi_annually":
            monthsToAdd = 6;
            break;
        case "annually":
            monthsToAdd = 12;
            break;
        default:
            throw new BadRequest_1.BadRequest("Invalid subscription type");
    }
    // Handle subscription
    if (!user.planId) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + monthsToAdd);
        await connection_1.db.insert(subscriptions_1.subscriptions).values({
            userId: user.id,
            planId: plan.id,
            paymentId: payment.id,
            startDate,
            endDate,
            status: "active",
            websitesCreatedCount: 0,
            websitesRemainingCount: plan?.websiteLimit || 0,
        });
        await connection_1.db.update(User_1.users).set({ planId: plan.id }).where((0, drizzle_orm_1.eq)(User_1.users.id, user.id));
    }
    else if (user.planId === plan.id) {
        const [subscription] = await connection_1.db
            .select()
            .from(subscriptions_1.subscriptions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.userId, user.id), (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.planId, plan.id), (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.status, "active")))
            .orderBy((0, drizzle_orm_1.desc)(subscriptions_1.subscriptions.createdAt))
            .limit(1);
        if (!subscription)
            throw new NotFound_1.NotFound("Active subscription not found");
        const newEndDate = new Date(subscription.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);
        await connection_1.db
            .update(subscriptions_1.subscriptions)
            .set({ endDate: newEndDate })
            .where((0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.id, subscription.id));
    }
    else {
        // Expire existing subscriptions
        await connection_1.db
            .update(subscriptions_1.subscriptions)
            .set({ status: "expired" })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.userId, user.id), (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.status, "active")));
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + monthsToAdd);
        await connection_1.db.insert(subscriptions_1.subscriptions).values({
            userId: user.id,
            planId: plan.id,
            paymentId: payment.id,
            startDate,
            endDate,
            status: "active",
            websitesCreatedCount: 0,
            websitesRemainingCount: plan?.websiteLimit || 0,
        });
        await connection_1.db.update(User_1.users).set({ planId: plan.id }).where((0, drizzle_orm_1.eq)(User_1.users.id, user.id));
    }
    await connection_1.db
        .update(payments_1.payments)
        .set({ status: "approved" })
        .where((0, drizzle_orm_1.eq)(payments_1.payments.id, Number(id)));
    const [updatedPayment] = await connection_1.db
        .select()
        .from(payments_1.payments)
        .where((0, drizzle_orm_1.eq)(payments_1.payments.id, Number(id)));
    (0, response_1.SuccessResponse)(res, {
        message: "Payment approved successfully",
        payment: updatedPayment,
    });
};
exports.updatePayment = updatePayment;
