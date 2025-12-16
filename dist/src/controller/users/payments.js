"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentById = exports.getAllPayments = exports.createPayment = void 0;
const connection_1 = require("../../models/connection");
const plans_1 = require("../../models/schema/plans");
const payments_1 = require("../../models/schema/payments");
const payment_methods_1 = require("../../models/schema/payment_methods");
const promo_code_1 = require("../../models/schema/promo_code");
const promocode_plans_1 = require("../../models/schema/promocode_plans");
const promocode_users_1 = require("../../models/schema/promocode_users");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const createPayment = async (req, res) => {
    if (!req.user)
        throw new unauthorizedError_1.UnauthorizedError("User is not authenticated");
    const userId = req.user.id;
    const { plan_id, paymentmethod_id, amount, code, subscriptionType } = req.body;
    if (!amount || !paymentmethod_id || !plan_id) {
        throw new BadRequest_1.BadRequest("Please provide all the required fields");
    }
    const planId = Number(plan_id);
    const paymentMethodId = Number(paymentmethod_id);
    if (isNaN(planId))
        throw new BadRequest_1.BadRequest("Invalid plan ID");
    if (isNaN(paymentMethodId))
        throw new BadRequest_1.BadRequest("Invalid payment method ID");
    const [plan] = await connection_1.db.select().from(plans_1.plans).where((0, drizzle_orm_1.eq)(plans_1.plans.id, planId));
    if (!plan)
        throw new NotFound_1.NotFound("Plan not found");
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new BadRequest_1.BadRequest("Amount must be a positive number");
    }
    const validAmounts = [
        plan.priceMonthly ? Number(plan.priceMonthly) : null,
        plan.priceQuarterly ? Number(plan.priceQuarterly) : null,
        plan.priceSemiAnnually ? Number(plan.priceSemiAnnually) : null,
        plan.priceAnnually ? Number(plan.priceAnnually) : null,
    ].filter((price) => price != null);
    if (!validAmounts.includes(parsedAmount)) {
        throw new BadRequest_1.BadRequest("Invalid payment amount for this plan");
    }
    // Calculate discount if code exists
    let discountAmount = 0;
    if (code) {
        const today = new Date();
        const [promo] = await connection_1.db
            .select()
            .from(promo_code_1.promoCodes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(promo_code_1.promoCodes.code, code), (0, drizzle_orm_1.eq)(promo_code_1.promoCodes.isActive, true), (0, drizzle_orm_1.lte)(promo_code_1.promoCodes.startDate, today), (0, drizzle_orm_1.gte)(promo_code_1.promoCodes.endDate, today)));
        if (!promo)
            throw new BadRequest_1.BadRequest("Invalid or expired promo code");
        const [alreadyUsed] = await connection_1.db
            .select()
            .from(promocode_users_1.promocodeUsers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.userId, Number(userId)), (0, drizzle_orm_1.eq)(promocode_users_1.promocodeUsers.codeId, promo.id)));
        if (alreadyUsed)
            throw new BadRequest_1.BadRequest("You have already used this promo code");
        const validSubscriptionTypes = [
            "monthly",
            "quarterly",
            "semi_annually",
            "yearly",
        ];
        if (!validSubscriptionTypes.includes(subscriptionType)) {
            throw new BadRequest_1.BadRequest("Invalid subscription type");
        }
        const [promoPlan] = await connection_1.db
            .select()
            .from(promocode_plans_1.promocodePlans)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(promocode_plans_1.promocodePlans.codeId, promo.id), (0, drizzle_orm_1.eq)(promocode_plans_1.promocodePlans.planId, plan.id)));
        if (!promoPlan)
            throw new BadRequest_1.BadRequest("Promo code does not apply to this plan");
        // Check if promo applies to subscription type
        const appliesToMap = {
            monthly: promoPlan.appliesToMonthly,
            quarterly: promoPlan.appliesToQuarterly,
            semi_annually: promoPlan.appliesToSemiAnnually,
            yearly: promoPlan.appliesToYearly,
        };
        if (!appliesToMap[subscriptionType]) {
            throw new BadRequest_1.BadRequest("Promo code does not apply to this plan/subscription type");
        }
        if (promo.discountType === "percentage") {
            discountAmount = (parsedAmount * Number(promo.discountValue)) / 100;
        }
        else {
            discountAmount = Number(promo.discountValue);
        }
        await connection_1.db.insert(promocode_users_1.promocodeUsers).values({
            userId: Number(userId),
            codeId: promo.id,
        });
    }
    const finalAmount = parsedAmount - discountAmount;
    if (finalAmount <= 0)
        throw new BadRequest_1.BadRequest("Invalid payment amount after applying promo code");
    // Build photo URL if uploaded
    let photoUrl;
    if (req.file) {
        photoUrl = `${req.protocol}://${req.get("host")}/uploads/payments/${req.file.filename}`;
    }
    const [result] = await connection_1.db
        .insert(payments_1.payments)
        .values({
        amount: String(finalAmount),
        paymentMethodId,
        planId,
        paymentDate: new Date(),
        userId: Number(userId),
        status: "pending",
        code,
        photo: photoUrl || "",
        subscriptionType,
    })
        .$returningId();
    const [payment] = await connection_1.db
        .select()
        .from(payments_1.payments)
        .where((0, drizzle_orm_1.eq)(payments_1.payments.id, result.id));
    (0, response_1.SuccessResponse)(res, {
        message: "Payment created successfully. Promo code applied (if valid).",
        payment,
        discountAmount,
    });
};
exports.createPayment = createPayment;
const getAllPayments = async (req, res) => {
    if (!req.user)
        throw new unauthorizedError_1.UnauthorizedError("user is not authenticated");
    const allPayments = await connection_1.db
        .select({
        payment: payments_1.payments,
        plan: plans_1.plans,
        paymentMethod: payment_methods_1.paymentMethods,
    })
        .from(payments_1.payments)
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(payments_1.payments.planId, plans_1.plans.id))
        .leftJoin(payment_methods_1.paymentMethods, (0, drizzle_orm_1.eq)(payments_1.payments.paymentMethodId, payment_methods_1.paymentMethods.id))
        .where((0, drizzle_orm_1.eq)(payments_1.payments.userId, Number(req.user.id)));
    const formattedPayments = allPayments.map((p) => ({
        ...p.payment,
        paymentmethod_id: p.paymentMethod,
        plan_id: p.plan,
    }));
    const pending = formattedPayments.filter((p) => p.status === "pending");
    const history = formattedPayments.filter((p) => ["approved", "rejected"].includes(p.status || ""));
    (0, response_1.SuccessResponse)(res, {
        message: "All payments fetched successfully",
        payments: {
            pending,
            history,
        },
    });
};
exports.getAllPayments = getAllPayments;
const getPaymentById = async (req, res) => {
    if (!req.user)
        throw new unauthorizedError_1.UnauthorizedError("user is not authenticated");
    const userId = req.user.id;
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide payment id");
    const [result] = await connection_1.db
        .select({
        payment: payments_1.payments,
        plan: plans_1.plans,
        paymentMethod: payment_methods_1.paymentMethods,
    })
        .from(payments_1.payments)
        .leftJoin(plans_1.plans, (0, drizzle_orm_1.eq)(payments_1.payments.planId, plans_1.plans.id))
        .leftJoin(payment_methods_1.paymentMethods, (0, drizzle_orm_1.eq)(payments_1.payments.paymentMethodId, payment_methods_1.paymentMethods.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(payments_1.payments.id, Number(id)), (0, drizzle_orm_1.eq)(payments_1.payments.userId, Number(userId))));
    if (!result)
        throw new NotFound_1.NotFound("Payment not found");
    const payment = {
        ...result.payment,
        paymentmethod_id: result.paymentMethod,
        plan_id: result.plan,
    };
    (0, response_1.SuccessResponse)(res, { message: "Payment fetched successfully", payment });
};
exports.getPaymentById = getPaymentById;
