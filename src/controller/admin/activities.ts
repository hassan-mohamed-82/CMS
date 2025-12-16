import { Request, Response } from "express";
import { db } from "../../models/connection";
import { activities } from "../../models/schema/activities";
import { templates } from "../../models/schema/templates";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { UnauthorizedError } from "../../Errors";

export const createActivity = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { name, isActive } = req.body;

  const existingActivity = await db
    .select()
    .from(activities)
    .where(eq(activities.name, name))
    .limit(1);

  if (existingActivity.length > 0)
    throw new BadRequest("Activity with this name already exists");

  const [activity] = await db
    .insert(activities)
    .values({ name, isActive })
    .$returningId();

  const [createdActivity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activity.id));

  SuccessResponse(res, {
    message: "Activity created successfully",
    activity: createdActivity,
  });
};

export const getAllActivities = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const allActivities = await db.select().from(activities);

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
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

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

export const updateActivity = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide activity id");

  const { name, isActive } = req.body;

  const [existingActivity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, Number(id)));

  if (!existingActivity) throw new NotFound("Activity not found");

  await db
    .update(activities)
    .set({ name, isActive })
    .where(eq(activities.id, Number(id)));

  const [updatedActivity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, Number(id)));

  SuccessResponse(res, {
    message: "Activity updated successfully",
    activity: updatedActivity,
  });
};

export const deleteActivity = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide activity id");

  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, Number(id)));

  if (!activity) throw new NotFound("Activity not found");

  await db.delete(activities).where(eq(activities.id, Number(id)));

  SuccessResponse(res, { message: "Activity deleted successfully" });
};
