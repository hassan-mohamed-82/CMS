"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePaymentMethod = exports.updatePaymentMethod = exports.getPaymentMethodById = exports.getAllPaymentMethods = exports.createPaymentMethod = void 0;
const connection_1 = require("../../models/connection");
const payment_methods_1 = require("../../models/schema/payment_methods");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const createPaymentMethod = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    }
    const { name, discription } = req.body;
    if (!name || !discription) {
        throw new BadRequest_1.BadRequest("Please provide all the required fields");
    }
    if (!req.file) {
        throw new BadRequest_1.BadRequest("Logo file is required");
    }
    const logoUrl = `${req.protocol}://${req.get("host")}/uploads/payment_logos/${req.file.filename}`;
    const [result] = await connection_1.db
        .insert(payment_methods_1.paymentMethods)
        .values({
        name,
        description: discription,
        logoUrl,
        isActive: true,
    })
        .$returningId();
    const [paymentMethod] = await connection_1.db
        .select()
        .from(payment_methods_1.paymentMethods)
        .where(eq(payment_methods_1.paymentMethods.id, result.id));
    (0, response_1.SuccessResponse)(res, {
        message: "Payment method created successfully",
        paymentMethod,
    });
};
exports.createPaymentMethod = createPaymentMethod;
const getAllPaymentMethods = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const allPaymentMethods = await connection_1.db.select().from(payment_methods_1.paymentMethods);
    if (!allPaymentMethods || allPaymentMethods.length === 0)
        throw new NotFound_1.NotFound("No payment methods found");
    (0, response_1.SuccessResponse)(res, {
        message: "All payment methods fetched successfully",
        paymentMethods: allPaymentMethods,
    });
};
exports.getAllPaymentMethods = getAllPaymentMethods;
const getPaymentMethodById = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide payment method id");
    const [paymentMethod] = await connection_1.db
        .select()
        .from(payment_methods_1.paymentMethods)
        .where(eq(payment_methods_1.paymentMethods.id, Number(id)));
    if (!paymentMethod)
        throw new NotFound_1.NotFound("Payment method not found");
    (0, response_1.SuccessResponse)(res, {
        message: "Payment method fetched successfully",
        paymentMethod,
    });
};
exports.getPaymentMethodById = getPaymentMethodById;
const updatePaymentMethod = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide payment method id");
    const [existingMethod] = await connection_1.db
        .select()
        .from(payment_methods_1.paymentMethods)
        .where(eq(payment_methods_1.paymentMethods.id, Number(id)));
    if (!existingMethod)
        throw new NotFound_1.NotFound("Payment method not found");
    const updateData = {};
    if (req.body.name)
        updateData.name = req.body.name;
    if (req.body.discription)
        updateData.description = req.body.discription;
    if (req.body.isActive !== undefined)
        updateData.isActive = req.body.isActive;
    if (req.file) {
        updateData.logoUrl = `${req.protocol}://${req.get("host")}/uploads/payment_logos/${req.file.filename}`;
    }
    await connection_1.db
        .update(payment_methods_1.paymentMethods)
        .set(updateData)
        .where(eq(payment_methods_1.paymentMethods.id, Number(id)));
    const [paymentMethod] = await connection_1.db
        .select()
        .from(payment_methods_1.paymentMethods)
        .where(eq(payment_methods_1.paymentMethods.id, Number(id)));
    (0, response_1.SuccessResponse)(res, {
        message: "Payment method updated successfully",
        paymentMethod,
    });
};
exports.updatePaymentMethod = updatePaymentMethod;
const deletePaymentMethod = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide payment method id");
    const [paymentMethod] = await connection_1.db
        .select()
        .from(payment_methods_1.paymentMethods)
        .where(eq(payment_methods_1.paymentMethods.id, Number(id)));
    if (!paymentMethod)
        throw new NotFound_1.NotFound("Payment method not found");
    await connection_1.db.delete(payment_methods_1.paymentMethods).where(eq(payment_methods_1.paymentMethods.id, Number(id)));
    (0, response_1.SuccessResponse)(res, { message: "Payment method deleted successfully" });
};
exports.deletePaymentMethod = deletePaymentMethod;
function eq(id, arg1) {
    throw new Error("Function not implemented.");
}
