import joi from "joi";
import { generalFields, validateQuery } from "../../middleware/validation.js";
export const createProduct = joi
  .object({
    name: joi.string().min(2).max(200).required().messages({
      "any.required": "Name is required",
      "string.empty": "not allowed to be empty",
      "string.base": "only string is allowed",
    }),
    description: joi.string().min(3).message({
      "string.empty": "not allowed to be empty",
      "string.base": "only string is allowed",
    }),
    size: joi.array().allow("ss", "s", "m", "l", "xl", "xxl", ""),
    colors: joi.array(),
    stock: joi.number().required(),
    price: joi.number().min(1).required(),
    discound: joi.number().min(0).max(100),
    file: joi
      .object({
        mainImage: joi
          .array()
          .items(generalFields.file.required())
          .length(1)
          .required(),
        subImages: joi.array().items(generalFields.file).max(5).min(1),
      })
      .required(),
    categoryId: generalFields.id,
    subcategoryId: generalFields.id,
    brandId: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();
export const updateProduct = joi
  .object({
    name: joi.string().min(2).max(200).messages({
      "string.empty": "not allowed to be empty",
      "string.base": "only string is allowed",
    }),
    description: joi.string().min(3).max(50).messages({
      "string.empty": "not allowed to be empty",
      "string.base": "only string is allowed",
    }),
    stock: joi.number(),
    price: joi.number().min(1),
    discound: joi.number(),
    colors: joi.array(),
    size: joi.array(),
    imageId: joi.string(),
    file: joi.object({
      mainImage: joi.array().items(generalFields.file).max(1),
      subImages: joi.array().items(generalFields.file).max(5).min(1),
    }),
    categoryId: generalFields.optionalId,
    subCategoryId: generalFields.optionalId,
    brandId: generalFields.optionalId,
    authorization: generalFields.headers,
  })
  .required();
export const IdAndHeaders = joi
  .object({
    id: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();
export const Headers = joi
  .object({
    authorization: joi.string().required(),
  })
  .required();
export const products = joi
  .object({
    ...validateQuery,
    authorization: joi.string(),

  })
  .required();
export const myProducts = joi
  .object({
    ...validateQuery,
    authorization: generalFields.headers,
  })
  .required();
export const getProductById = joi
  .object({
    id: generalFields.id,
    authorization: joi.string(),
  })
  .required();
export const productsOfSpecificSubcategory = joi
  .object({
    ...validateQuery,
    authorization: joi.string(),
    subCategoryId: generalFields.id,
  })
  .required();
export const productsOfSpecificCategory = joi
  .object({
    ...validateQuery,
    authorization: joi.string(),
    categoryId: generalFields.id,
  })
  .required();
