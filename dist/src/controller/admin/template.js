"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.getTemplateById = exports.updateTemplate = exports.getAllTemplates = exports.createTemplate = void 0;
const connection_1 = require("../../models/connection");
const templates_1 = require("../../models/schema/templates");
const activities_1 = require("../../models/schema/activities");
const drizzle_orm_1 = require("drizzle-orm");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const unauthorizedError_1 = require("../../Errors/unauthorizedError");
const response_1 = require("../../utils/response");
const createTemplate = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    }
    const { name, activityId } = req.body;
    if (!name)
        throw new BadRequest_1.BadRequest("name is required");
    if (!activityId)
        throw new BadRequest_1.BadRequest("activityId is required");
    const files = req.files;
    if (!files || !files["template_file_path"] || !files["photo"]) {
        throw new BadRequest_1.BadRequest("All files (template, photo) are required");
    }
    const buildLink = (file, folder) => `${req.protocol}://${req.get("host")}/uploads/${folder}/${file.filename}`;
    const templateFile = files["template_file_path"][0];
    const photoFile = files["photo"][0];
    const [result] = await connection_1.db
        .insert(templates_1.templates)
        .values({
        name,
        activityId: Number(activityId),
        templateFilePath: buildLink(templateFile, "templates"),
        photo: buildLink(photoFile, "templates"),
    })
        .$returningId();
    const [newTemplate] = await connection_1.db
        .select()
        .from(templates_1.templates)
        .where((0, drizzle_orm_1.eq)(templates_1.templates.id, result.id));
    (0, response_1.SuccessResponse)(res, {
        message: "Template created successfully",
        newTemplate,
    });
};
exports.createTemplate = createTemplate;
const getAllTemplates = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
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
const updateTemplate = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    }
    const { id } = req.params;
    const { name, activityId, isActive, New } = req.body;
    if (!id)
        throw new BadRequest_1.BadRequest("Template ID is required");
    const [existingTemplate] = await connection_1.db
        .select()
        .from(templates_1.templates)
        .where((0, drizzle_orm_1.eq)(templates_1.templates.id, Number(id)));
    if (!existingTemplate)
        throw new NotFound_1.NotFound("Template not found");
    const updateData = {};
    if (name)
        updateData.name = name;
    if (activityId)
        updateData.activityId = Number(activityId);
    if (typeof isActive !== "undefined")
        updateData.isActive = isActive;
    if (typeof New !== "undefined")
        updateData.isNew = New;
    const files = req.files;
    if (files?.template_file_path && files.template_file_path[0]) {
        updateData.templateFilePath = `${req.protocol}://${req.get("host")}/uploads/templates/${files.template_file_path[0].filename}`;
    }
    if (files?.photo && files.photo[0]) {
        updateData.photo = `${req.protocol}://${req.get("host")}/uploads/templates/${files.photo[0].filename}`;
    }
    await connection_1.db
        .update(templates_1.templates)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(templates_1.templates.id, Number(id)));
    const [template] = await connection_1.db
        .select()
        .from(templates_1.templates)
        .where((0, drizzle_orm_1.eq)(templates_1.templates.id, Number(id)));
    (0, response_1.SuccessResponse)(res, {
        message: "Template updated successfully",
        template,
    });
};
exports.updateTemplate = updateTemplate;
const getTemplateById = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
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
const deleteTemplate = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("ID is required");
    const [template] = await connection_1.db
        .select()
        .from(templates_1.templates)
        .where((0, drizzle_orm_1.eq)(templates_1.templates.id, Number(id)));
    if (!template)
        throw new NotFound_1.NotFound("Template not found");
    await connection_1.db.delete(templates_1.templates).where((0, drizzle_orm_1.eq)(templates_1.templates.id, Number(id)));
    (0, response_1.SuccessResponse)(res, { message: "template deleted successfully" });
};
exports.deleteTemplate = deleteTemplate;
