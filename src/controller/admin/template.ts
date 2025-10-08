import { Request, Response } from 'express';
import {TemplateModel } from '../../models/shema/templates';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { UnauthorizedError } from '../../Errors/unauthorizedError';
import { SuccessResponse } from '../../utils/response';



export const createTemplate = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin") {
    throw new UnauthorizedError("Access denied");
  }

  const { name, activityId } = req.body;
  if (!name) throw new BadRequest("name is required");
  if (!activityId) throw new BadRequest("activityId is required");

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  if (
    !files ||
    !files["template_file_path"] ||
    !files["photo"] 
    // ||
    // !files["overphoto"]
  ) {
    throw new BadRequest("All files (template, photo, overphoto) are required");
  }

  // بناء اللينك كامل لكل ملف
  const buildLink = (file: Express.Multer.File, folder: string) =>
    `${req.protocol}://${req.get("host")}/uploads/${folder}/${file.filename}`;

  const templateFile = files["template_file_path"][0];
  const photoFile = files["photo"][0];
  // const overphotoFile = files["overphoto"][0];

  const newTemplate = await TemplateModel.create({
    name,
    activityId,
    template_file_path: buildLink(templateFile, "templates"),
    photo: buildLink(photoFile, "templates"),
    // overphoto: buildLink(overphotoFile, "templates"),
  });

  SuccessResponse(res, {
    message: "Template created successfully",
    newTemplate,
  });
};
export const getAllTemplates =async (req: Request, res: Response) => {
     if (!req.user || req.user.role !== 'admin')  throw new UnauthorizedError("Access denied");
    const template = await TemplateModel.find().populate('activityId','name isActive');
    if(!template) throw new NotFound("Template not found")

SuccessResponse(res,{message:"get template successfully",template})

  }

export const updateTemplate = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin") {
    throw new UnauthorizedError("Access denied");
  }

  const { id } = req.params;
  const { name, activityId, isActive, New } = req.body; // ← خد القيم من body

  if (!id) throw new BadRequest("Template ID is required");

  // 📌 بناء update object
  const updateData: any = {};
  if (name) updateData.name = name;
  if (activityId) updateData.activityId = activityId;

  // ✅ الحقول الجديدة
  if (typeof isActive !== "undefined") updateData.isActive = isActive;
  if (typeof New !== "undefined") updateData.New = New;

  // ✅ Multer بيرجع الملفات في req.files
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (files?.template_file_path && files.template_file_path[0]) {
    updateData.template_file_path = files.template_file_path[0].path;
  }

  if (files?.photo && files.photo[0]) {
    updateData.photo = files.photo[0].path;
  }

  const template = await TemplateModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );

  if (!template) throw new NotFound("Template not found");

  SuccessResponse(res, {
    message: "Template updated successfully",
    template,
  });
};

export const getTemplateById = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin") throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("ID is required");

  const template = await TemplateModel.findById(id).populate('activityId','name isActive');
  if (!template) throw new NotFound("Template not found");  

  SuccessResponse(res, { message: "get template successfully", template });
};

export const deleteTemplate = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin") throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("ID is required");

  const template = await TemplateModel.findByIdAndDelete(id);
  if (!template) throw new NotFound("Template not found");

  SuccessResponse(res, { message: "template deleted successfully" });
};



