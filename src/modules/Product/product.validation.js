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
    colors: joi.array().items(
      joi.object({
        name: joi.string().min(2).max(100).required(),
        sizes: joi.array().items(
          joi.object({
            size: joi.string().allow("ss", "s", "m", "l", "xl", "xxl", "xxxl", "").required(),
            stock: joi.number().required()
          })
        ).required(),
      })
    ).required().min(1),
    price: joi.number().min(1).required(),
    discount: joi.number().min(0).max(100),
    file: joi.array().items(generalFields.file).required(),
    categoryId: generalFields.id,
    subcategoryId: generalFields.id,
    brandId: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();




export const updateProduct = joi
  .object({
    name: joi.string().min(2).max(200).messages({
      "any.required": "Name is required",
      "string.empty": "not allowed to be empty",
      "string.base": "only string is allowed",
    }),
    description: joi.string().min(3).message({
      "string.empty": "not allowed to be empty",
      "string.base": "only string is allowed",
    }),
    colors: joi.array().items(
      joi.object({
        name: joi.string().min(2).max(100),
        sizes: joi.array().items(
          joi.object({
            size: joi.string().allow("ss", "s", "m", "l", "xl", "xxl", "xxxl", ""),
            stock: joi.number()
          })
        ),
      })
    ).min(1),
    price: joi.number().min(1),
    discount: joi.number().min(0).max(100),
    file: joi.array().items(generalFields.file),
    categoryId: generalFields.optionalId,
    subcategoryId: generalFields.optionalId,
    brandId: generalFields.optionalId,
    authorization: generalFields.headers,
    replaceImages: joi.boolean(),
    imageId: joi.string(),
  })
  .required();

// export const updateProduct = joi
//   .object({
//     name: joi.string().min(2).max(200).messages({
//       "string.empty": "not allowed to be empty",
//       "string.base": "only string is allowed",
//     }),
//     description: joi.string().min(3).max(50).messages({
//       "string.empty": "not allowed to be empty",
//       "string.base": "only string is allowed",
//     }),
//     stock: joi.number(),
//     price: joi.number().min(1),
//     discount: joi.number(),
//     colors: joi.array(),
//     size: joi.array(),
//     imageId: joi.string(),
//     replaceImages: joi.boolean(),
//     file: joi.array().items(generalFields.file).max(5),
//     categoryId: generalFields.optionalId,
//     subcategoryId: generalFields.optionalId,
//     brandId: generalFields.optionalId,
//     id: generalFields.id,
//     authorization: generalFields.headers,
//   })
//   .required();

export const IdAndHeaders = joi
  .object({
    id: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();
// export const Headers = joi
//   .object({
//     authorization: joi.string().required(),
//   })
//   .required();
export const products = joi
  .object({
    ...validateQuery,
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
  })
  .required();
export const productsOfSpecificSubcategory = joi
  .object({
    ...validateQuery,
    authorization: joi.string(),
    subcategoryId: generalFields.id,
  })
  .required();
export const productsOfSpecificCategory = joi
  .object({
    ...validateQuery,
    authorization: joi.string(),
    categoryId: generalFields.id,
  })
  .required();

export const createProductWithVariants = joi.object({
  name: joi.string().min(3).max(100).required(),
  description: joi.string().min(10).max(1000).required(),
  color: joi.array().items(
    joi.object({
      neme: joi.string().required(),
      sizes: joi.array().items(
        joi.object({
          size: joi.string().valid('S', 'M', 'L', 'XL').required(),
          stock: joi.number().integer().min(0).required()
        })
      ).required()
    })
  ).required(),
  price: joi.number().min(0).required(),
  discount: joi.number().min(0).max(100),
  categoryId: generalFields.id,
  subcategoryId: generalFields.id,
  brandId: generalFields.id,
  authorization: joi.string(),
})
  .required();
