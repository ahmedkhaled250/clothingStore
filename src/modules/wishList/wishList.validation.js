import joi from "joi";
import { generalFields } from "../../middleware/validation.js";
export const wishList = joi
  .object({
    productId: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();
export const token = joi
  .object({
    authorization: generalFields.headers,
  })
  .required();
export const getWishList = joi
  .object({
    page: joi.number(),
    size: joi.number(),
    authorization: generalFields.headers,
  })
  .required();