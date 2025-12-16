import { Request, Response } from "express";
import { db } from "../../models/connection";
import { subscriptions } from "../../models/schema/subscriptions";
import { websites } from "../../models/schema/websites";
import { templates } from "../../models/schema/templates";
import { users } from "../../models/schema/auth/User";
import { eq, and, gte, desc } from "drizzle-orm";
import { UnauthorizedError } from "../../Errors/index";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { SuccessResponse } from "../../utils/response";
import fs from "fs";
import path from "path";

export const createWebsite = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const { templateId, activitiesId, demo_link } = req.body;
  if (!templateId || !demo_link || !activitiesId) {
    throw new BadRequest("Please provide all required fields");
  }

  // Check if template exists
  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, Number(templateId)));

  if (!template) throw new BadRequest("Template not found");

  // Get active subscription
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, Number(req.user.id)),
        eq(subscriptions.status, "active"),
        gte(subscriptions.endDate, new Date())
      )
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!subscription) {
    throw new BadRequest("You do not have an active subscription");
  }

  // Check website limit
  if ((subscription.websitesRemainingCount || 0) <= 0) {
    throw new BadRequest("You have reached your website creation limit");
  }

  // Create copy of template
  const websiteId = new Date().getTime();
  const websitesDir = path.join(
    __dirname,
    "../../uploads/websites",
    String(websiteId)
  );
  if (!fs.existsSync(websitesDir)) {
    fs.mkdirSync(websitesDir, { recursive: true });
  }

  // Get filename from link
  const templateFileName = path.basename(template.templateFilePath);
  const templateSourcePath = path.join(
    __dirname,
    "../../uploads/templates",
    templateFileName
  );
  const copiedTemplatePath = path.join(websitesDir, templateFileName);

  // Copy file
  fs.copyFileSync(templateSourcePath, copiedTemplatePath);

  // Build new project link
  const projectLink = `${req.protocol}://${req.get("host")}/uploads/websites/${websiteId}/${templateFileName}`;

  // Create new website
  const [result] = await db
    .insert(websites)
    .values({
      userId: Number(req.user.id),
      templateId: Number(templateId),
      activityId: Number(activitiesId),
      demoLink: demo_link,
      projectPath: projectLink,
      startDate: new Date(),
      endDate: subscription.endDate,
      status: "pending_admin_review",
    })
    .$returningId();

  const [newWebsite] = await db
    .select()
    .from(websites)
    .where(eq(websites.id, result.id));

  // Update subscription
  await db
    .update(subscriptions)
    .set({
      websitesCreatedCount: (subscription.websitesCreatedCount || 0) + 1,
      websitesRemainingCount: (subscription.websitesRemainingCount || 0) - 1,
    })
    .where(eq(subscriptions.id, subscription.id));

  SuccessResponse(res, {
    message: "Website created successfully",
    newWebsite,
    subscriptionStatus: {
      websites_created_count: (subscription.websitesCreatedCount || 0) + 1,
      websites_remaining_count: (subscription.websitesRemainingCount || 0) - 1,
    },
  });
};

export const getAllWebsites = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const userId = req.user.id;

  const data = await db
    .select()
    .from(websites)
    .where(eq(websites.userId, Number(userId)));

  if (!data || data.length === 0) throw new NotFound("No website found");

  SuccessResponse(res, { message: "All website fetched successfully", data });
};

export const getWebsiteById = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const { id } = req.params;
  if (!id) throw new BadRequest("Please provide website id");

  const [result] = await db
    .select({
      website: websites,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(websites)
    .leftJoin(users, eq(websites.userId, users.id))
    .where(eq(websites.id, Number(id)));

  if (!result) throw new NotFound("Website not found");

  const data = {
    ...result.website,
    userId: result.user,
  };

  SuccessResponse(res, { message: "Website fetched successfully", data });
};

export const updateWebsite = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const { websiteId } = req.params;
  const { demo_link, status, rejected_reason } = req.body;

  // Validate ID
  if (!websiteId || isNaN(Number(websiteId))) {
    throw new BadRequest("Invalid website ID format");
  }

  // Get user's website
  const [website] = await db
    .select()
    .from(websites)
    .where(
      and(
        eq(websites.id, Number(websiteId)),
        eq(websites.userId, Number(req.user.id))
      )
    );

  if (!website) {
    throw new NotFound("Website not found or you do not own it");
  }

  // Update fields
  const updateData: Partial<typeof websites.$inferInsert> = {};
  if (demo_link) updateData.demoLink = demo_link;
  if (status) updateData.status = status;
  if (rejected_reason) updateData.rejectedReason = rejected_reason;

  // Handle file upload
  if (req.file) {
    const websiteFolder = path.join(
      __dirname,
      "../../uploads/websites",
      String(website.id)
    );

    if (!fs.existsSync(websiteFolder)) {
      fs.mkdirSync(websiteFolder, { recursive: true });
    }

    const fileName = Date.now() + path.extname(req.file.originalname);
    const newPath = path.join(websiteFolder, fileName);

    fs.writeFileSync(newPath, req.file.buffer);

    const projectLink = `${req.protocol}://${req.get("host")}/uploads/websites/${website.id}/${fileName}`;

    updateData.projectPath = projectLink;
  }

  await db
    .update(websites)
    .set(updateData)
    .where(eq(websites.id, Number(websiteId)));

  const [updatedWebsite] = await db
    .select()
    .from(websites)
    .where(eq(websites.id, Number(websiteId)));

  SuccessResponse(res, {
    message: "Website updated successfully",
    website: updatedWebsite,
  });
};

export const deleteWebsite = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("User not authenticated");

  const { websiteId } = req.params;

  const [website] = await db
    .select()
    .from(websites)
    .where(
      and(
        eq(websites.id, Number(websiteId)),
        eq(websites.userId, Number(req.user.id))
      )
    );

  if (!website) {
    throw new BadRequest("Website not found or you do not own it");
  }

  // Delete files
  if (fs.existsSync(website.projectPath)) {
    try {
      fs.rmSync(website.projectPath, { recursive: true, force: true });
    } catch (err) {
      console.error("Error deleting website files:", err);
    }
  }

  await db.delete(websites).where(eq(websites.id, website.id));

  // Update subscription
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, Number(req.user.id)))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (subscription) {
    await db
      .update(subscriptions)
      .set({
        websitesCreatedCount: Math.max(
          0,
          (subscription.websitesCreatedCount || 0) - 1
        ),
        websitesRemainingCount: (subscription.websitesRemainingCount || 0) + 1,
      })
      .where(eq(subscriptions.id, subscription.id));
  }

  SuccessResponse(res, {
    message: "Website deleted successfully, limit restored",
    subscriptionStatus: {
      websites_created_count: subscription
        ? Math.max(0, (subscription.websitesCreatedCount || 0) - 1)
        : 0,
      websites_remaining_count: subscription
        ? (subscription.websitesRemainingCount || 0) + 1
        : 0,
    },
  });
};
