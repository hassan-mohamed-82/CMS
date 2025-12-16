"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateById = exports.getAllTemplates = void 0;
const connection_1 = require("../../models/connection");
const templates_1 = require("../../models/schema/templates");
const activities_1 = require("../../models/schema/activities");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const getAllTemplates = async (req, res) => {
    const allTemplates = await connection_1.db
        .select({
        template: templates_1.templates,
        activity: {
            id: activities_1.activities.id,
            name: activities_1.activities.name,
            isActive: activities_1.activities.isActive,
        },
    })
        .from(templates_1.templates)
        .leftJoin(activities_1.activities, (0, drizzle_orm_1.eq)(templates_1.templates.activityId, activities_1.activities.id));
    const formattedTemplates = allTemplates.map((item) => ({
        ...item.template,
        activityId: item.activity,
    }));
    if (!formattedTemplates || formattedTemplates.length === 0)
        throw new NotFound_1.NotFound("Template not found");
    (0, response_1.SuccessResponse)(res, {
        message: "get template successfully",
        template: formattedTemplates,
    });
};
exports.getAllTemplates = getAllTemplates;
const getTemplateById = async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("ID is required");
    const [result] = await connection_1.db
        .select({
        template: templates_1.templates,
        activity: {
            id: activities_1.activities.id,
            name: activities_1.activities.name,
            isActive: activities_1.activities.isActive,
        },
    })
        .from(templates_1.templates)
        .leftJoin(activities_1.activities, (0, drizzle_orm_1.eq)(templates_1.templates.activityId, activities_1.activities.id))
        .where((0, drizzle_orm_1.eq)(templates_1.templates.id, Number(id)));
    if (!result)
        throw new NotFound_1.NotFound("Template not found");
    const template = {
        ...result.template,
        activityId: result.activity,
    };
    (0, response_1.SuccessResponse)(res, { message: "get template successfully", template });
};
exports.getTemplateById = getTemplateById;
