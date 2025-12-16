import { Request, Response } from "express";
import { db } from "../../models/connection";
import { activities } from "../../models/schema/activities";
import { templates } from "../../models/schema/templates";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { UnauthorizedError } from "../../Errors";

export const getAllActivities = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("user is not authenticated");

  const allActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.isActive, true));

  // Get templates for each activity
  const activitiesWithTemplates = await Promise.all(
    allActivities.map(async (activity) => {
      const activityTemplates = await db
        .select()
        .from(templates)
        .where(eq(templates.activityId, activity.id));
      return { ...activity, templates: activityTemplates };
    })
  );

  SuccessResponse(res, {
    message: "All activities fetched successfully",
    activities: activitiesWithTemplates,
  });
};

export const getActivityById = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("user is not authenticated");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide activity id");

  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, Number(id)));

  if (!activity) throw new NotFound("Activity not found");

  const activityTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.activityId, activity.id));

  SuccessResponse(res, {
    message: "Activity fetched successfully",
    activity: { ...activity, templates: activityTemplates },
  });
};
