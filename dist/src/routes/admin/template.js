"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const template_1 = require("../../controller/admin/template");
const Multer_1 = require("../../utils/Multer");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
// إنشاء Template مع رفع الملفات: template_file_path, photo, overphoto
router.post("/", Multer_1.uploadTemplate.fields([
    { name: "template_file_path", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    // { name: "overphoto", maxCount: 1 }, // ← جديد
]), (0, catchAsync_1.catchAsync)(template_1.createTemplate));
// جلب كل Templates
router.get("/", (0, catchAsync_1.catchAsync)(template_1.getAllTemplates));
// جلب Template حسب الـ ID
router.get("/:id", (0, catchAsync_1.catchAsync)(template_1.getTemplateById));
// تحديث Template مع رفع الملفات
router.put("/:id", Multer_1.uploadTemplate.fields([
    { name: "template_file_path", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    // { name: "overphoto", maxCount: 1 }, // ← جديد
]), (0, catchAsync_1.catchAsync)(template_1.updateTemplate));
// حذف Template
router.delete("/:id", (0, catchAsync_1.catchAsync)(template_1.deleteTemplate));
exports.default = router;
