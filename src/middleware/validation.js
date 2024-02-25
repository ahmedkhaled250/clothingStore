import { Types } from "mongoose";
import { asyncHandler } from "../utils/errorHandling.js";
import joi from "joi";
export const validateObjectId = (value, helper) => {
  return Types.ObjectId.isValid(value)
    ? true
    : helper.message("In-valid objectId");
};
export const validateQuery = {
  page: joi.number(),
  size: joi.number(),
  sort: joi.string(),
  stock: [joi.number(), joi.object()],
  price: [joi.number(), joi.object()],
  discound: [joi.number(), joi.object()],
  finalPrice: [joi.number(), joi.object()],
  soldItems: [joi.number(), joi.object()],
  rating: [joi.number().min(1).max(5), joi.object()],
  deleted: [joi.boolean()],
  search: joi.string(),
  fields: joi.string(),
};
export const generalFields = {
  email: joi
    .string()
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 4,
      tlds: { allow: ["com", "net"] },
    })
    .required(),
  password: joi
    .string()
    .pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/))
    .required(),
  cPassword: joi.string().required(),
  id: joi.string().custom(validateObjectId).required(),
  optionalId: joi.string().custom(validateObjectId),

  file: joi.object({
    size: joi.number().positive().required(),
    path: joi.string().required(),
    filename: joi.string().required(),
    destination: joi.string().required(),
    mimetype: joi.string().required(),
    encoding: joi.string().required(),
    originalname: joi.string().required(),
    fieldname: joi.string().required(),
  }),
  headers: joi.string().required(),
};
const validation = (schema) => {
  return asyncHandler(async (req, res, next) => {
    const inputsData = {
      ...req.body,
      ...req.params,
      ...req.query,
    };
    if (req.headers.authorization) {
      inputsData.authorization = req.headers.authorization;
    }
    if (req.file || req.files) {
      inputsData.file = req.file || req.files;
    }
    const validationResult = schema.validate(inputsData, {
      abortEarly: false,
    });
    if (validationResult?.error?.details) {
      return res.status(400).json({
        message: "Validation err",
        validationError: validationResult.error.details,
      });
    }
    return next();
  });
};
export default validation;
