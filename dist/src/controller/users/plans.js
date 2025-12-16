"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlanById = exports.getAllPlans = void 0;
const connection_1 = require("../../models/connection");
const plans_1 = require("../../models/schema/plans");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const getAllPlans = async (req, res) => {
    const allPlans = await connection_1.db.select().from(plans_1.plans);
    (0, response_1.SuccessResponse)(res, { message: "All plans fetched successfully", plans: allPlans });
};
exports.getAllPlans = getAllPlans;
const getPlanById = async (req, res) => {
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
