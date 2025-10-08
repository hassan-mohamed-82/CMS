"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.getTemplateById = exports.updateTemplate = exports.getAllTemplates = exports.createTemplate = void 0;
const templates_1 = require("../../models/shema/templates");
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
    if (!files ||
        !files["template_file_path"] ||
        !files["photo"]
    // ||
    // !files["overphoto"]
    ) {
        throw new BadRequest_1.BadRequest("All files (template, photo, overphoto) are required");
    }
    // بناء اللينك كامل لكل ملف
    const buildLink = (file, folder) => `${req.protocol}://${req.get("host")}/uploads/${folder}/${file.filename}`;
    const templateFile = files["template_file_path"][0];
    const photoFile = files["photo"][0];
    // const overphotoFile = files["overphoto"][0];
    const newTemplate = await templates_1.TemplateModel.create({
        name,
        activityId,
        template_file_path: buildLink(templateFile, "templates"),
        photo: buildLink(photoFile, "templates"),
        // overphoto: buildLink(overphotoFile, "templates"),
    });
    (0, response_1.SuccessResponse)(res, {
        message: "Template created successfully",
        newTemplate,
    });
};
exports.createTemplate = createTemplate;
const getAllTemplates = async (req, res) => {
    if (!req.user || req.user.role !== 'admin')
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const template = await templates_1.TemplateModel.find().populate('activityId', 'name isActive');
    if (!template)
        throw new NotFound_1.NotFound("Template not found");
    (0, response_1.SuccessResponse)(res, { message: "get template successfully", template });
};
exports.getAllTemplates = getAllTemplates;
const updateTemplate = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    }
    const { id } = req.params;
    const { name, activityId, isActive, New } = req.body; // ← خد القيم من body
    if (!id)
        throw new BadRequest_1.BadRequest("Template ID is required");
    // 📌 بناء update object
    const updateData = {};
    if (name)
        updateData.name = name;
    if (activityId)
        updateData.activityId = activityId;
    // ✅ الحقول الجديدة
    if (typeof isActive !== "undefined")
        updateData.isActive = isActive;
    if (typeof New !== "undefined")
        updateData.New = New;
    // ✅ Multer بيرجع الملفات في req.files
    const files = req.files;
    if (files?.template_file_path && files.template_file_path[0]) {
        updateData.template_file_path = files.template_file_path[0].path;
    }
    if (files?.photo && files.photo[0]) {
        updateData.photo = files.photo[0].path;
    }
    const template = await templates_1.TemplateModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!template)
        throw new NotFound_1.NotFound("Template not found");
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
    const template = await templates_1.TemplateModel.findById(id).populate('activityId', 'name isActive');
    if (!template)
        throw new NotFound_1.NotFound("Template not found");
    (0, response_1.SuccessResponse)(res, { message: "get template successfully", template });
};
exports.getTemplateById = getTemplateById;
const deleteTemplate = async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        throw new unauthorizedError_1.UnauthorizedError("Access denied");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("ID is required");
    const template = await templates_1.TemplateModel.findByIdAndDelete(id);
    if (!template)
        throw new NotFound_1.NotFound("Template not found");
    (0, response_1.SuccessResponse)(res, { message: "template deleted successfully" });
};
exports.deleteTemplate = deleteTemplate;
