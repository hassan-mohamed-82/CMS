"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteActivity = exports.updateActivity = exports.getActivityById = exports.getAllActivities = exports.createActivity = void 0;
const connection_1 = require("../../models/connection");
const activities_1 = require("../../models/schema/activities");
const templates_1 = require("../../models/schema/templates");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const Errors_1 = require("../../Errors");
const response_1 = require("../../utils/response");
const Errors_2 = require("../../Errors");
const createActivity = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new Errors_2.UnauthorizedError("Access denied");
    const { name, isActive } = req.body;
    const existingActivity = await connection_1.db
        .select()
        .from(activities_1.activities)
        .where((0, drizzle_orm_1.eq)(activities_1.activities.name, name))
        .limit(1);
    if (existingActivity.length > 0)
        throw new BadRequest_1.BadRequest("Activity with this name already exists");
    const [activity] = await connection_1.db
        .insert(activities_1.activities)
        .values({ name, isActive })
        .$returningId();
    const [createdActivity] = await connection_1.db
        .select()
        .from(activities_1.activities)
        .where((0, drizzle_orm_1.eq)(activities_1.activities.id, activity.id));
    (0, response_1.SuccessResponse)(res, {
        message: "Activity created successfully",
        activity: createdActivity,
    });
};
exports.createActivity = createActivity;
const getAllActivities = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new Errors_2.UnauthorizedError("Access denied");
    const allActivities = await connection_1.db.select().from(activities_1.activities);
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
    if (!req.user || req.user.role !== "admin")
        throw new Errors_2.UnauthorizedError("Access denied");
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
const updateActivity = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new Errors_2.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide activity id");
    const { name, isActive } = req.body;
    const [existingActivity] = await connection_1.db
        .select()
        .from(activities_1.activities)
        .where((0, drizzle_orm_1.eq)(activities_1.activities.id, Number(id)));
    if (!existingActivity)
        throw new Errors_1.NotFound("Activity not found");
    await connection_1.db
        .update(activities_1.activities)
        .set({ name, isActive })
        .where((0, drizzle_orm_1.eq)(activities_1.activities.id, Number(id)));
    const [updatedActivity] = await connection_1.db
        .select()
        .from(activities_1.activities)
        .where((0, drizzle_orm_1.eq)(activities_1.activities.id, Number(id)));
    (0, response_1.SuccessResponse)(res, {
        message: "Activity updated successfully",
        activity: updatedActivity,
    });
};
exports.updateActivity = updateActivity;
const deleteActivity = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new Errors_2.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide activity id");
    const [activity] = await connection_1.db
        .select()
        .from(activities_1.activities)
        .where((0, drizzle_orm_1.eq)(activities_1.activities.id, Number(id)));
    if (!activity)
        throw new Errors_1.NotFound("Activity not found");
    await connection_1.db.delete(activities_1.activities).where((0, drizzle_orm_1.eq)(activities_1.activities.id, Number(id)));
    (0, response_1.SuccessResponse)(res, { message: "Activity deleted successfully" });
};
exports.deleteActivity = deleteActivity;
