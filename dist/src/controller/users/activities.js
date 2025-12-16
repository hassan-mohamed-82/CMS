"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityById = exports.getAllActivities = void 0;
const connection_1 = require("../../models/connection");
const activities_1 = require("../../models/schema/activities");
const templates_1 = require("../../models/schema/templates");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const Errors_2 = require("../../Errors");
const getAllActivities = async (req, res) => {
    if (!req.user)
        throw new Errors_2.UnauthorizedError("user is not authenticated");
    const allActivities = await connection_1.db
        .select()
        .from(activities_1.activities)
        .where((0, drizzle_orm_1.eq)(activities_1.activities.isActive, true));
    // Get templates for each activity
    const activitiesWithTemplates = await Promise.all(allActivities.map(async (activity) => {
        const activityTemplates = await connection_1.db
            .select()
            .from(templates_1.templates)
            .where((0, drizzle_orm_1.eq)(templates_1.templates.activityId, activity.id));
        return { ...activity, templates: activityTemplates };
    }));
    (0, response_1.SuccessResponse)(res, {
        message: "All activities fetched successfully",
        activities: activitiesWithTemplates,
    });
};
exports.getAllActivities = getAllActivities;
const getActivityById = async (req, res) => {
    if (!req.user)
        throw new Errors_2.UnauthorizedError("user is not authenticated");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide activity id");
    const [activity] = await connection_1.db
        .select()
        .from(activities_1.activities)
        .where((0, drizzle_orm_1.eq)(activities_1.activities.id, Number(id)));
    if (!activity)
        throw new Errors_1.NotFound("Activity not found");
    const activityTemplates = await connection_1.db
        .select()
        .from(templates_1.templates)
        .where((0, drizzle_orm_1.eq)(templates_1.templates.activityId, activity.id));
    (0, response_1.SuccessResponse)(res, {
        message: "Activity fetched successfully",
        activity: { ...activity, templates: activityTemplates },
    });
};
exports.getActivityById = getActivityById;
