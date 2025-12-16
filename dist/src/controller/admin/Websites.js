"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWebsiteStatus = exports.getWebsiteById = exports.getAllWebsites = void 0;
const connection_1 = require("../../models/connection");
const websites_1 = require("../../models/schema/websites");
const User_1 = require("../../models/schema/auth/User");
const templates_1 = require("../../models/schema/templates");
const activities_1 = require("../../models/schema/activities");
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../../Errors/index");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const getAllWebsites = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new index_1.UnauthorizedError("Access denied");
    const allWebsites = await connection_1.db
        .select({
        website: websites_1.websites,
        user: {
            id: User_1.users.id,
            name: User_1.users.name,
            email: User_1.users.email,
        },
        template: {
            id: templates_1.templates.id,
            name: templates_1.templates.name,
        },
        activity: {
            id: activities_1.activities.id,
            name: activities_1.activities.name,
        },
    })
        .from(websites_1.websites)
        .leftJoin(User_1.users, (0, drizzle_orm_1.eq)(websites_1.websites.userId, User_1.users.id))
        .leftJoin(templates_1.templates, (0, drizzle_orm_1.eq)(websites_1.websites.templateId, templates_1.templates.id))
        .leftJoin(activities_1.activities, (0, drizzle_orm_1.eq)(websites_1.websites.activityId, activities_1.activities.id));
    const formattedWebsites = allWebsites.map((item) => ({
        ...item.website,
        userId: item.user,
        templateId: item.template,
        activitiesId: item.activity,
    }));
    (0, response_1.SuccessResponse)(res, {
        message: "All websites fetched successfully",
        websites: formattedWebsites,
    });
};
exports.getAllWebsites = getAllWebsites;
const getWebsiteById = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new index_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Website ID is required");
    const [result] = await connection_1.db
        .select({
        website: websites_1.websites,
        user: {
            id: User_1.users.id,
            name: User_1.users.name,
            email: User_1.users.email,
        },
        template: {
            id: templates_1.templates.id,
            name: templates_1.templates.name,
        },
        activity: {
            id: activities_1.activities.id,
            name: activities_1.activities.name,
        },
    })
        .from(websites_1.websites)
        .leftJoin(User_1.users, (0, drizzle_orm_1.eq)(websites_1.websites.userId, User_1.users.id))
        .leftJoin(templates_1.templates, (0, drizzle_orm_1.eq)(websites_1.websites.templateId, templates_1.templates.id))
        .leftJoin(activities_1.activities, (0, drizzle_orm_1.eq)(websites_1.websites.activityId, activities_1.activities.id))
        .where((0, drizzle_orm_1.eq)(websites_1.websites.id, Number(id)));
    if (!result)
        throw new NotFound_1.NotFound("Website not found");
    const website = {
        ...result.website,
        userId: result.user,
        templateId: result.template,
        activitiesId: result.activity,
    };
    (0, response_1.SuccessResponse)(res, { message: "Website fetched successfully", website });
};
exports.getWebsiteById = getWebsiteById;
const updateWebsiteStatus = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new index_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    const { status, rejected_reason } = req.body;
    if (!id)
        throw new BadRequest_1.BadRequest("Website ID is required");
    if (!["approved", "rejected"].includes(status))
        throw new BadRequest_1.BadRequest("Status must be 'approved' or 'rejected'");
    const [existingWebsite] = await connection_1.db
        .select()
        .from(websites_1.websites)
        .where((0, drizzle_orm_1.eq)(websites_1.websites.id, Number(id)));
    if (!existingWebsite)
        throw new NotFound_1.NotFound("Website not found");
    const updateData = {
        status,
    };
    if (status === "rejected") {
        updateData.rejectedReason = rejected_reason || "Not specified";
    }
    await connection_1.db.update(websites_1.websites).set(updateData).where((0, drizzle_orm_1.eq)(websites_1.websites.id, Number(id)));
    const [website] = await connection_1.db
        .select()
        .from(websites_1.websites)
        .where((0, drizzle_orm_1.eq)(websites_1.websites.id, Number(id)));
    (0, response_1.SuccessResponse)(res, {
        message: "Website status updated successfully",
        website,
    });
};
exports.updateWebsiteStatus = updateWebsiteStatus;
