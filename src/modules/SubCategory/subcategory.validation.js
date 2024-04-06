import joi from "joi";
import { generalFields } from "../../middleware/validation.js";
export const createSubcategory = joi
  .object({
    name: joi.string().min(2).max(50).required(),
    categoryId: generalFields.id,
    subcategoryId: generalFields.optionalId,
    authorization: generalFields.headers,
    file: generalFields.file.required(),
  })
  .required()
export const updateSubcategory = joi
  .object({
    name: joi.string().min(2).max(50),
    file: generalFields.file,
    id: generalFields.id,
    categoryId: generalFields.id,
    authorization: generalFields.headers,
  })
  .required()
export const subCategories = joi
  .object({
    page: joi.number(),
    size: joi.number(),
  })
  .required()
export const subCategoryByCategoryId = joi
  .object({
    categoryId: generalFields.id,
    page: joi.number(),
    size: joi.number(),
  })
  .required();
export const getSubcategoryById = joi
  .object({
    id: generalFields.id,
  })
  .required()
