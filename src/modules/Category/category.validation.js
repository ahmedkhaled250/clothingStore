import joi from "joi";
import {
  generalFields,
} from "../../middleware/validation.js";
export const createCategory = joi
  .object({
    name: joi.string().min(2).max(50).required(),
    authorization: generalFields.headers,
    file: generalFields.file.required(),
  })
  .required()
export const updateCategory = joi
  .object({
    id: generalFields.id,
    name: joi.string().min(2).max(50),
    authorization: generalFields.headers,
    file: generalFields.file,
  })
  .required()
export const categories = joi
  .object({
    page: joi.number(),
    size: joi.number(),
  })
  .required()
export const getCategoryById = joi
  .object({
    id: joi.string().required(),
  })
  .required()
