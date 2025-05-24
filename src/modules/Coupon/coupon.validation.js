import joi from "joi";
import { generalFields,validateQuery } from "../../middleware/validation.js";
export const createCoupon = joi
  .object({
    name: joi.string().min(2).max(20).required(),
    amount: joi.number().required().min(1).max(100),
    expireDate: joi.date().required(),
    authorization: generalFields.headers,
  })
  .required()
export const updateCoupon = joi
  .object({
    name: joi.string().min(2).max(20),
    amount: joi.number().min(1).max(100),
    expireDate: joi.date(),
    id: generalFields.id,
    authorization: joi.string().required(),
  })
  .required()
export const softDeleteCoupon = joi
  .object({
    id: generalFields.id,
    authorization: generalFields.headers,
  })
  .required()
export const coupons = joi
  .object({
    ...validateQuery,
    authorization: generalFields.headers,
  })
  .required()
export const coupon = joi
  .object({
    id: generalFields.id,
  })
  .required()
