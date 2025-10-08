import { Router } from "express";
import {
  createTemplate,
  updateTemplate,
  getAllTemplates,
  getTemplateById,
  deleteTemplate,
} from "../../controller/admin/template";
import { uploadTemplate } from "../../utils/Multer";
import { catchAsync } from "../../utils/catchAsync";

const router = Router();

// إنشاء Template مع رفع الملفات: template_file_path, photo, overphoto
router.post(
  "/",
  uploadTemplate.fields([
    { name: "template_file_path", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    // { name: "overphoto", maxCount: 1 }, // ← جديد
  ]),
  catchAsync(createTemplate)
);

// جلب كل Templates
router.get("/", catchAsync(getAllTemplates));

// جلب Template حسب الـ ID
router.get("/:id", catchAsync(getTemplateById));

// تحديث Template مع رفع الملفات
router.put(
  "/:id",
  uploadTemplate.fields([
    { name: "template_file_path", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    // { name: "overphoto", maxCount: 1 }, // ← جديد
  ]),
  catchAsync(updateTemplate)
);

// حذف Template
router.delete("/:id", catchAsync(deleteTemplate));

export default router;
