"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWebsite = exports.updateWebsite = exports.getWebsiteById = exports.getAllWebsites = exports.createWebsite = void 0;
const connection_1 = require("../../models/connection");
const subscriptions_1 = require("../../models/schema/subscriptions");
const websites_1 = require("../../models/schema/websites");
const templates_1 = require("../../models/schema/templates");
const User_1 = require("../../models/schema/auth/User");
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../../Errors/index");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const createWebsite = async (req, res) => {
    if (!req.user)
        throw new index_1.UnauthorizedError("User not authenticated");
    const { templateId, activitiesId, demo_link } = req.body;
    if (!templateId || !demo_link || !activitiesId) {
        throw new BadRequest_1.BadRequest("Please provide all required fields");
    }
    // Check if template exists
    const [template] = await connection_1.db
        .select()
        .from(templates_1.templates)
        .where((0, drizzle_orm_1.eq)(templates_1.templates.id, Number(templateId)));
    if (!template)
        throw new BadRequest_1.BadRequest("Template not found");
    // Get active subscription
    const [subscription] = await connection_1.db
        .select()
        .from(subscriptions_1.subscriptions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.userId, Number(req.user.id)), (0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.status, "active"), (0, drizzle_orm_1.gte)(subscriptions_1.subscriptions.endDate, new Date())))
        .orderBy((0, drizzle_orm_1.desc)(subscriptions_1.subscriptions.createdAt))
        .limit(1);
    if (!subscription) {
        throw new BadRequest_1.BadRequest("You do not have an active subscription");
    }
    // Check website limit
    if ((subscription.websitesRemainingCount || 0) <= 0) {
        throw new BadRequest_1.BadRequest("You have reached your website creation limit");
    }
    // Create copy of template
    const websiteId = new Date().getTime();
    const websitesDir = path_1.default.join(__dirname, "../../uploads/websites", String(websiteId));
    if (!fs_1.default.existsSync(websitesDir)) {
        fs_1.default.mkdirSync(websitesDir, { recursive: true });
    }
    // Get filename from link
    const templateFileName = path_1.default.basename(template.templateFilePath);
    const templateSourcePath = path_1.default.join(__dirname, "../../uploads/templates", templateFileName);
    const copiedTemplatePath = path_1.default.join(websitesDir, templateFileName);
    // Copy file
    fs_1.default.copyFileSync(templateSourcePath, copiedTemplatePath);
    // Build new project link
    const projectLink = `${req.protocol}://${req.get("host")}/uploads/websites/${websiteId}/${templateFileName}`;
    // Create new website
    const [result] = await connection_1.db
        .insert(websites_1.websites)
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
    const [newWebsite] = await connection_1.db
        .select()
        .from(websites_1.websites)
        .where((0, drizzle_orm_1.eq)(websites_1.websites.id, result.id));
    // Update subscription
    await connection_1.db
        .update(subscriptions_1.subscriptions)
        .set({
        websitesCreatedCount: (subscription.websitesCreatedCount || 0) + 1,
        websitesRemainingCount: (subscription.websitesRemainingCount || 0) - 1,
    })
        .where((0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.id, subscription.id));
    (0, response_1.SuccessResponse)(res, {
        message: "Website created successfully",
        newWebsite,
        subscriptionStatus: {
            websites_created_count: (subscription.websitesCreatedCount || 0) + 1,
            websites_remaining_count: (subscription.websitesRemainingCount || 0) - 1,
        },
    });
};
exports.createWebsite = createWebsite;
const getAllWebsites = async (req, res) => {
    if (!req.user)
        throw new index_1.UnauthorizedError("User not authenticated");
    const userId = req.user.id;
    const data = await connection_1.db
        .select()
        .from(websites_1.websites)
        .where((0, drizzle_orm_1.eq)(websites_1.websites.userId, Number(userId)));
    if (!data || data.length === 0)
        throw new NotFound_1.NotFound("No website found");
    (0, response_1.SuccessResponse)(res, { message: "All website fetched successfully", data });
};
exports.getAllWebsites = getAllWebsites;
const getWebsiteById = async (req, res) => {
    if (!req.user)
        throw new index_1.UnauthorizedError("User not authenticated");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Please provide website id");
    const [result] = await connection_1.db
        .select({
        website: websites_1.websites,
        user: {
            id: User_1.users.id,
            name: User_1.users.name,
            email: User_1.users.email,
        },
    })
        .from(websites_1.websites)
        .leftJoin(User_1.users, (0, drizzle_orm_1.eq)(websites_1.websites.userId, User_1.users.id))
        .where((0, drizzle_orm_1.eq)(websites_1.websites.id, Number(id)));
    if (!result)
        throw new NotFound_1.NotFound("Website not found");
    const data = {
        ...result.website,
        userId: result.user,
    };
    (0, response_1.SuccessResponse)(res, { message: "Website fetched successfully", data });
};
exports.getWebsiteById = getWebsiteById;
const updateWebsite = async (req, res) => {
    if (!req.user)
        throw new index_1.UnauthorizedError("User not authenticated");
    const { websiteId } = req.params;
    const { demo_link, status, rejected_reason } = req.body;
    // Validate ID
    if (!websiteId || isNaN(Number(websiteId))) {
        throw new BadRequest_1.BadRequest("Invalid website ID format");
    }
    // Get user's website
    const [website] = await connection_1.db
        .select()
        .from(websites_1.websites)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(websites_1.websites.id, Number(websiteId)), (0, drizzle_orm_1.eq)(websites_1.websites.userId, Number(req.user.id))));
    if (!website) {
        throw new NotFound_1.NotFound("Website not found or you do not own it");
    }
    // Update fields
    const updateData = {};
    if (demo_link)
        updateData.demoLink = demo_link;
    if (status)
        updateData.status = status;
    if (rejected_reason)
        updateData.rejectedReason = rejected_reason;
    // Handle file upload
    if (req.file) {
        const websiteFolder = path_1.default.join(__dirname, "../../uploads/websites", String(website.id));
        if (!fs_1.default.existsSync(websiteFolder)) {
            fs_1.default.mkdirSync(websiteFolder, { recursive: true });
        }
        const fileName = Date.now() + path_1.default.extname(req.file.originalname);
        const newPath = path_1.default.join(websiteFolder, fileName);
        fs_1.default.writeFileSync(newPath, req.file.buffer);
        const projectLink = `${req.protocol}://${req.get("host")}/uploads/websites/${website.id}/${fileName}`;
        updateData.projectPath = projectLink;
    }
    await connection_1.db
        .update(websites_1.websites)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(websites_1.websites.id, Number(websiteId)));
    const [updatedWebsite] = await connection_1.db
        .select()
        .from(websites_1.websites)
        .where((0, drizzle_orm_1.eq)(websites_1.websites.id, Number(websiteId)));
    (0, response_1.SuccessResponse)(res, {
        message: "Website updated successfully",
        website: updatedWebsite,
    });
};
exports.updateWebsite = updateWebsite;
const deleteWebsite = async (req, res) => {
    if (!req.user)
        throw new index_1.UnauthorizedError("User not authenticated");
    const { websiteId } = req.params;
    const [website] = await connection_1.db
        .select()
        .from(websites_1.websites)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(websites_1.websites.id, Number(websiteId)), (0, drizzle_orm_1.eq)(websites_1.websites.userId, Number(req.user.id))));
    if (!website) {
        throw new BadRequest_1.BadRequest("Website not found or you do not own it");
    }
    // Delete files
    if (fs_1.default.existsSync(website.projectPath)) {
        try {
            fs_1.default.rmSync(website.projectPath, { recursive: true, force: true });
        }
        catch (err) {
            console.error("Error deleting website files:", err);
        }
    }
    await connection_1.db.delete(websites_1.websites).where((0, drizzle_orm_1.eq)(websites_1.websites.id, website.id));
    // Update subscription
    const [subscription] = await connection_1.db
        .select()
        .from(subscriptions_1.subscriptions)
        .where((0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.userId, Number(req.user.id)))
        .orderBy((0, drizzle_orm_1.desc)(subscriptions_1.subscriptions.createdAt))
        .limit(1);
    if (subscription) {
        await connection_1.db
            .update(subscriptions_1.subscriptions)
            .set({
            websitesCreatedCount: Math.max(0, (subscription.websitesCreatedCount || 0) - 1),
            websitesRemainingCount: (subscription.websitesRemainingCount || 0) + 1,
        })
            .where((0, drizzle_orm_1.eq)(subscriptions_1.subscriptions.id, subscription.id));
    }
    (0, response_1.SuccessResponse)(res, {
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
exports.deleteWebsite = deleteWebsite;
