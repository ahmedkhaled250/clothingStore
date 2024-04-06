import joi from "joi";
import { generalFields ,validateQuery} from "../../middleware/validation.js";
export const createBrand = joi
  .object({
    name: joi.string().min(2).max(20).required(),
    file: generalFields.file.required(),
    authorization: generalFields.headers,
  })
  .required()
export const updateBrand = joi
  .object({
    name: joi.string().min(2).max(20),
    file: generalFields.file,
    id: generalFields.id,
    authorization: generalFields.headers,
  })
  .required()
export const brands = joi
  .object({
    ...validateQuery
  })
  .required()
export const getBrandById = joi
  .object({
    id: generalFields.id,
  })
  .required()
