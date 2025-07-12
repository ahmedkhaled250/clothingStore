import joi from "joi";
import { generalFields } from "../../middleware/validation.js";
export const addtoCart = joi
  .object({
    productId: generalFields.id,
    quantity: joi.number().min(1).required(),
    colorCode: joi.string().required(),
    size: joi.number().allow("ss", "s", "m", "l", "xl", "xxl", "xxxl", "").required(),
    authorization: generalFields.headers,
  })
  .required()
export const deleteFromCart = joi
  .object({
    productId: generalFields.id,
    cartId: generalFields.id,
    colorCode: joi.string().required(),
    size: joi.number().allow("ss", "s", "m", "l", "xl", "xxl", "xxxl", "").required(),
    authorization: generalFields.headers,
  })
  .required()
export const removeProductsFromCart = joi
  .object({
    id: generalFields.id,
    authorization: generalFields.headers,
  })
  .required()
export const getMyCart = joi
  .object({
    authorization: generalFields.headers,
  })
  .required()
