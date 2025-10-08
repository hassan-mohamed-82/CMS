"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateById = exports.getAllTemplates = void 0;
const templates_1 = require("../../models/shema/templates");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const getAllTemplates = async (req, res) => {
    const template = await templates_1.TemplateModel.find().populate('activityId', 'name isActive');
    if (!template)
        throw new NotFound_1.NotFound("Template not found");
    (0, response_1.SuccessResponse)(res, { message: "get template successfully", template });
};
exports.getAllTemplates = getAllTemplates;
const getTemplateById = async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("ID is required");
    const template = await templates_1.TemplateModel.findById(id).populate('activityId', 'name isActive');
    if (!template)
        throw new NotFound_1.NotFound("Template not found");
    (0, response_1.SuccessResponse)(res, { message: "get template successfully", template });
};
exports.getTemplateById = getTemplateById;
