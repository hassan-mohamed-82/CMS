import { Request, Response } from "express";
import { db } from "../../models/connection";
import { websites } from "../../models/schema/websites";
import { users } from "../../models/schema/auth/User";
import { templates } from "../../models/schema/templates";
import { activities } from "../../models/schema/activities";
import { eq } from "drizzle-orm";
import { UnauthorizedError } from "../../Errors/index";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { SuccessResponse } from "../../utils/response";

export const getAllWebsites = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const allWebsites = await db
    .select({
      website: websites,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      template: {
        id: templates.id,
        name: templates.name,
      },
      activity: {
        id: activities.id,
        name: activities.name,
      },
    })
    .from(websites)
    .leftJoin(users, eq(websites.userId, users.id))
    .leftJoin(templates, eq(websites.templateId, templates.id))
    .leftJoin(activities, eq(websites.activityId, activities.id));

  const formattedWebsites = allWebsites.map((item) => ({
    ...item.website,
    userId: item.user,
    templateId: item.template,
    activitiesId: item.activity,
  }));

  SuccessResponse(res, {
    message: "All websites fetched successfully",
    websites: formattedWebsites,
  });
};

export const getWebsiteById = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  if (!id) throw new BadRequest("Website ID is required");

  const [result] = await db
    .select({
      website: websites,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      template: {
        id: templates.id,
        name: templates.name,
      },
      activity: {
        id: activities.id,
        name: activities.name,
      },
    })
    .from(websites)
    .leftJoin(users, eq(websites.userId, users.id))
    .leftJoin(templates, eq(websites.templateId, templates.id))
    .leftJoin(activities, eq(websites.activityId, activities.id))
    .where(eq(websites.id, Number(id)));

  if (!result) throw new NotFound("Website not found");

  const website = {
    ...result.website,
    userId: result.user,
    templateId: result.template,
    activitiesId: result.activity,
  };

  SuccessResponse(res, { message: "Website fetched successfully", website });
};

export const updateWebsiteStatus = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== "admin")
    throw new UnauthorizedError("Access denied");

  const { id } = req.params;
  const { status, rejected_reason } = req.body;

  if (!id) throw new BadRequest("Website ID is required");
  if (!["approved", "rejected"].includes(status))
    throw new BadRequest("Status must be 'approved' or 'rejected'");

  const [existingWebsite] = await db
    .select()
    .from(websites)
    .where(eq(websites.id, Number(id)));

  if (!existingWebsite) throw new NotFound("Website not found");

  const updateData: Partial<typeof websites.$inferInsert> = {
    status,
  };

  if (status === "rejected") {
    updateData.rejectedReason = rejected_reason || "Not specified";
  }

  await db.update(websites).set(updateData).where(eq(websites.id, Number(id)));

  const [website] = await db
    .select()
    .from(websites)
    .where(eq(websites.id, Number(id)));

  SuccessResponse(res, {
    message: "Website status updated successfully",
    website,
  });
};
