import { Request, Response } from "express";
import { db } from "../../models/connection";
import { templates } from "../../models/schema/templates";
import { activities } from "../../models/schema/activities";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { UnauthorizedError } from "../../Errors/unauthorizedError";
import { SuccessResponse } from "../../utils/response";

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

  if (!files || !files["template_file_path"] || !files["photo"]) {
    throw new BadRequest("All files (template, photo) are required");
  }

  const buildLink = (file: Express.Multer.File, folder: string) =>
    `${req.protocol}://${req.get("host")}/uploads/${folder}/${file.filename}`;

  const templateFile = files["template_file_path"][0];
  const photoFile = files["photo"][0];

  const [result] = await db
    .insert(templates)
    .values({
      name,
      activityId: Number(activityId),
      templateFilePath: buildLink(templateFile, "templates"),
      photo: buildLink(photoFile, "templates"),
    })
    .$returningId();

  const [newTemplate] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, result.id));

  SuccessResponse(res, {
    message: "Template created successfully",
    newTemplate,
  });
};

export const getAllTemplates = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const allTemplates = await db
    .select({
      template: templates,
      activity: {
        id: activities.id,
        name: activities.name,
        isActive: activities.isActive,
      },
    })
    .from(templates)
    .leftJoin(activities, eq(templates.activityId, activities.id));

  const formattedTemplates = allTemplates.map((item) => ({
    ...item.template,
    activityId: item.activity,
  }));

  if (!formattedTemplates || formattedTemplates.length === 0)
    throw new NotFound("Template not found");

  SuccessResponse(res, {
    message: "get template successfully",
    template: formattedTemplates,
  });
};

export const updateTemplate = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin") {
    throw new UnauthorizedError("Access denied");
  }

  const { id } = req.params;
  const { name, activityId, isActive, New } = req.body;

  if (!id) throw new BadRequest("Template ID is required");

  const [existingTemplate] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, Number(id)));

  if (!existingTemplate) throw new NotFound("Template not found");

  const updateData: Partial<typeof templates.$inferInsert> = {};
  if (name) updateData.name = name;
  if (activityId) updateData.activityId = Number(activityId);
  if (typeof isActive !== "undefined") updateData.isActive = isActive;
  if (typeof New !== "undefined") updateData.isNew = New;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (files?.template_file_path && files.template_file_path[0]) {
    updateData.templateFilePath = `${req.protocol}://${req.get("host")}/uploads/templates/${files.template_file_path[0].filename}`;
  }

  if (files?.photo && files.photo[0]) {
    updateData.photo = `${req.protocol}://${req.get("host")}/uploads/templates/${files.photo[0].filename}`;
  }

  await db
    .update(templates)
    .set(updateData)
    .where(eq(templates.id, Number(id)));

  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, Number(id)));

  SuccessResponse(res, {
    message: "Template updated successfully",
    template,
  });
};

export const getTemplateById = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("ID is required");

  const [result] = await db
    .select({
      template: templates,
      activity: {
        id: activities.id,
        name: activities.name,
        isActive: activities.isActive,
      },
    })
    .from(templates)
    .leftJoin(activities, eq(templates.activityId, activities.id))
    .where(eq(templates.id, Number(id)));

  if (!result) throw new NotFound("Template not found");

  const template = {
    ...result.template,
    activityId: result.activity,
  };

  SuccessResponse(res, { message: "get template successfully", template });
};

export const deleteTemplate = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("ID is required");

  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, Number(id)));

  if (!template) throw new NotFound("Template not found");

  await db.delete(templates).where(eq(templates.id, Number(id)));

  SuccessResponse(res, { message: "template deleted successfully" });
};
