import { Request, Response } from 'express';
import { TemplateModel } from '../../models/shema/templates';
import { BadRequest } from '../../Errors/BadRequest';
import { NotFound } from '../../Errors/NotFound';
import { UnauthorizedError } from '../../Errors/unauthorizedError';
import { SuccessResponse } from '../../utils/response';

export const getAllTemplates =async (req: Request, res: Response) => {
    const template = await TemplateModel.find().populate('activityId','name isActive');
    if(!template) throw new NotFound("Template not found")

SuccessResponse(res,{message:"get template successfully",template})

  }

export const getTemplateById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequest("ID is required");
  
    const template = await TemplateModel.findById(id).populate('activityId','name isActive');
    if (!template) throw new NotFound("Template not found");
  
    SuccessResponse(res, { message: "get template successfully", template });
  };
  