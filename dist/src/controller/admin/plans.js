"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePlan = exports.updatePlan = exports.getPlanById = exports.getAllPlans = exports.createPlan = void 0;
const connection_1 = require("../../models/connection");
const plans_1 = require("../../models/schema/plans");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const createPlan = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { name, price_monthly, price_quarterly, price_semi_annually, price_annually, website_limit, } = req.body;
    if (!name ||
        !price_quarterly ||
        !price_semi_annually ||
        !price_annually ||
        !website_limit ||
        !price_monthly)
        throw new BadRequest_1.BadRequest("Please provide all the required fields");
    const [result] = await connection_1.db
        .insert(plans_1.plans)
        .values({
        name,
        priceMonthly: String(price_monthly),
        priceQuarterly: String(price_quarterly),
        priceSemiAnnually: String(price_semi_annually),
        priceAnnually: String(price_annually),
        websiteLimit: website_limit,
    })
        .$returningId();
    const [plan] = await connection_1.db.select().from(plans_1.plans).where((0, drizzle_orm_1.eq)(plans_1.plans.id, result.id));
    (0, response_1.SuccessResponse)(res, { message: "Plan created successfully", plan });
};
exports.createPlan = createPlan;
const getAllPlans = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const allPlans = await connection_1.db.select().from(plans_1.plans);
    (0, response_1.SuccessResponse)(res, { message: "All plans fetched successfully", plans: allPlans });
};
exports.getAllPlans = getAllPlans;
const getPlanById = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide plan id");
    const [plan] = await connection_1.db
        .select()
        .from(plans_1.plans)
        .where((0, drizzle_orm_1.eq)(plans_1.plans.id, Number(id)));
    if (!plan)
        throw new NotFound_1.NotFound("Plan not found");
    (0, response_1.SuccessResponse)(res, { message: "Plan fetched successfully", plan });
};
exports.getPlanById = getPlanById;
const updatePlan = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide plan id");
    const { name, price_quarterly, price_semi_annually, price_annually, website_limit, price_monthly } = req.body;
    const [existingPlan] = await connection_1.db
        .select()
        .from(plans_1.plans)
        .where((0, drizzle_orm_1.eq)(plans_1.plans.id, Number(id)));
    if (!existingPlan)
        throw new NotFound_1.NotFound("Plan not found");
    const updateData = {};
    if (name)
        updateData.name = name;
    if (price_monthly)
        updateData.priceMonthly = String(price_monthly);
    if (price_quarterly)
        updateData.priceQuarterly = String(price_quarterly);
    if (price_semi_annually)
        updateData.priceSemiAnnually = String(price_semi_annually);
    if (price_annually)
        updateData.priceAnnually = String(price_annually);
    if (website_limit)
        updateData.websiteLimit = website_limit;
    await connection_1.db.update(plans_1.plans).set(updateData).where((0, drizzle_orm_1.eq)(plans_1.plans.id, Number(id)));
    const [plan] = await connection_1.db.select().from(plans_1.plans).where((0, drizzle_orm_1.eq)(plans_1.plans.id, Number(id)));
    (0, response_1.SuccessResponse)(res, { message: "Plan updated successfully", plan });
};
exports.updatePlan = updatePlan;
const deletePlan = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide plan id");
    const [plan] = await connection_1.db
        .select()
        .from(plans_1.plans)
        .where((0, drizzle_orm_1.eq)(plans_1.plans.id, Number(id)));
    if (!plan)
        throw new NotFound_1.NotFound("Plan not found");
    await connection_1.db.delete(plans_1.plans).where((0, drizzle_orm_1.eq)(plans_1.plans.id, Number(id)));
    (0, response_1.SuccessResponse)(res, { message: "Plan deleted successfully" });
};
exports.deletePlan = deletePlan;
