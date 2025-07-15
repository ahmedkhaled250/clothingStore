import joi from "joi";
import { generalFields, validateQuery } from "../../middleware/validation.js";
export const addOrder = joi
  .object({
    products: joi.array().items(
      joi
        .object()
        .required()
        .keys({
          productId: generalFields.id,
          quantity: joi.number().min(1).required(),
          colorCode: joi.string().required(),
          size: joi.number().allow("ss", "s", "m", "l", "xl", "xxl", "xxxl", "").required(),
        })
    ),
    couponName: joi.string(),
    phone: joi.string()
      .required()
      .trim()
      .min(7)
      .max(20)
      .pattern(/^[\d\s\-\(\)\+\.]+$/)
      .messages({
        'string.empty': 'Phone number is required',
        'string.min': 'Phone number must be at least 7 characters',
        'string.max': 'Phone number cannot exceed 20 characters',
        'string.pattern.base': 'Phone number contains invalid characters'
      }),
    // phone: joi
    //   .string()
    //   .pattern(/^01[0125][0-9]{8}$/)
    //   .required(),
    address: joi.object().keys({
      country: joi.string().required(),
      governorate: joi.string().required(),
      city: joi.string().required(),
      street: joi.string(),
      buildingNumber: joi.string()
    }).required(),
    note: joi.string(),
    paymentMethod: joi.string().valid("cash", "card"),
    authorization: generalFields.headers,
  })
  .required();
export const cencelOrder = joi
  .object({
    id: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();
export const userOrders = joi
  .object({
    ...validateQuery,
    authorization: generalFields.headers,
  })
  .required();
