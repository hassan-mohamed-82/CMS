import { Request, Response } from "express";
import { db } from "../../models/connection";
import { templates } from "../../models/schema/templates";
import { activities } from "../../models/schema/activities";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { SuccessResponse } from "../../utils/response";

export const getAllTemplates = async (req: Request, res: Response) => {
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

export const getTemplateById = async (req: Request, res: Response) => {
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
