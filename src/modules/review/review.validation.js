import joi from "joi";
import { generalFields ,validateQuery} from "../../middleware/validation.js";
export const addReview = joi
  .object({
    message: joi.string().min(2).max(300).required(),
    rating: joi.number().min(1).max(5).required(),
    productId: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();
export const updateReview = joi
  .object({
    rating: joi.number().min(1).max(5),
    message: joi.string().min(2).max(50),
    reviewId: generalFields.id,
    productId: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();
export const deleteReview = joi
  .object({
    productId: generalFields.id,
    reviewId: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();
export const productId = joi
  .object({
    ...validateQuery,
    productId: generalFields.id,
    authorization: joi.string(),
  })
  .required();
export const review = joi
  .object({
    productId: generalFields.id,
    authorization: joi.string(),
    id: generalFields.id,
  })
  .required();
