import joi from "joi";
import { generalFields } from "../../middleware/validation.js";
export const superAdminAccessInUser = joi
  .object({
    id: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();
export const profilePic = joi
  .object({
    authorization: generalFields.headers,
    file: generalFields.file.required(),
  })
  .required()
export const token = joi
  .object({
    authorization: generalFields.headers,
  })
  .required()
export const updatePassword = joi
  .object({
    oldPassword: generalFields.password,
    password: generalFields.password,
    cPassword: generalFields.cPassword.valid(joi.ref("password")),
    authorization: generalFields.headers,
  })
  .required()
export const blockUser = joi
  .object({
    id: generalFields.id,
    authorization: generalFields.headers,
  })
  .required()
export const getUserById = joi
  .object({
    id: generalFields.id,
  })
  .required()
