"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePayment = exports.getPaymentByIdAdmin = exports.getAllPaymentsAdmin = void 0;
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const subscriptions_1 = require("../../models/shema/subscriptions");
const payments_1 = require("../../models/shema/payments");
const User_1 = require("../../models/shema/auth/User");
const promo_code_1 = require("../../models/shema/promo_code");
const promocode_users_1 = require("../../models/shema/promocode_users");
const getAllPaymentsAdmin = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const payments = await payments_1.PaymentModel.find()
        .populate("userId", "name email") // هات اسم و ايميل اليوزر بس
        .populate("plan_id") // هات تفاصيل البلان
        .populate("paymentmethod_id"); // هات تفاصيل الميثود
    const pending = payments.filter(p => p.status === "pending");
    const history = payments.filter(p => ["approved", "rejected"].includes(p.status));
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
    const payment = await payments_1.PaymentModel.findById(id)
        .populate("userId", "name email")
        .populate("plan_id")
        .populate("paymentmethod_id");
    if (!payment)
        throw new NotFound_1.NotFound("Payment not found");
    (0, response_1.SuccessResponse)(res, { message: "Payment fetched successfully (admin)", payment });
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
    const payment = await payments_1.PaymentModel.findById(id).populate("plan_id");
    if (!payment)
        throw new NotFound_1.NotFound("Payment not found");
    // تحديث حالة الدفع
    payment.status = status;
    if (status === "rejected") {
        payment.rejected_reason = rejected_reason || "No reason provided";
        await payment.save();
        return (0, response_1.SuccessResponse)(res, { message: "Payment rejected", payment });
    }
    // لو approved
    const plan = payment.plan_id;
    const user = await User_1.UserModel.findById(payment.userId);
    if (!user)
        throw new NotFound_1.NotFound("User not found");
    // ✅ التحقق من Promo Code
    if (payment.code) {
        const promo = await promo_code_1.PromoCodeModel.findOne({
            code: payment.code,
            isActive: true,
            start_date: { $lte: new Date() },
            end_date: { $gte: new Date() },
            available_users: { $gt: 0 }
        });
        if (promo) {
            promo.available_users -= 1;
            await promo.save();
            const alreadyUsed = await promocode_users_1.PromoCodeUserModel.findOne({
                userId: user._id,
                codeId: promo._id
            });
            if (!alreadyUsed) {
                await promocode_users_1.PromoCodeUserModel.create({
                    userId: user._id,
                    codeId: promo._id
                });
            }
        }
    }
    // تحديد عدد الأشهر للإشتراك بناءً على subscriptionType
    let monthsToAdd = 0;
    const subscriptionType = payment.subscriptionType || "quarterly"; // افتراضي quarterly إذا مش محدد
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
        default: throw new BadRequest_1.BadRequest("Invalid subscription type");
    }
    // التعامل مع الاشتراك
    if (!user.planId) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + monthsToAdd);
        await subscriptions_1.SubscriptionModel.create({
            userId: user._id,
            planId: plan._id,
            PaymentId: payment._id,
            startDate,
            endDate,
            status: "active",
            websites_created_count: 0,
            websites_remaining_count: plan.website_limit || 0,
        });
        user.planId = plan._id;
        await user.save();
    }
    else if (user.planId.toString() === plan._id.toString()) {
        const subscription = await subscriptions_1.SubscriptionModel.findOne({
            userId: user._id,
            planId: plan._id,
            status: "active",
        }).sort({ createdAt: -1 });
        if (!subscription)
            throw new NotFound_1.NotFound("Active subscription not found");
        subscription.endDate.setMonth(subscription.endDate.getMonth() + monthsToAdd);
        await subscription.save();
    }
    else {
        await subscriptions_1.SubscriptionModel.updateMany({ userId: user._id, status: "active" }, { $set: { status: "expired" } });
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + monthsToAdd);
        await subscriptions_1.SubscriptionModel.create({
            userId: user._id,
            planId: plan._id,
            PaymentId: payment._id,
            startDate,
            endDate,
            status: "active",
            websites_created_count: 0,
            websites_remaining_count: plan.website_limit || 0,
        });
        user.planId = plan._id;
        await user.save();
    }
    await payment.save();
    (0, response_1.SuccessResponse)(res, { message: "Payment approved successfully", payment });
};
exports.updatePayment = updatePayment;
