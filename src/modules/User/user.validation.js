import joi from "joi";
import { generalFields } from "../../middleware/validation.js";
export const updateUser = joi
  .object({
    userName: joi.string().min(2).max(20).message({
      "any.required": "userName is required",
      "any.empty": "empty userName isn't acceptable",
    }),
    email: joi
      .string()
      .email({
        minDomainSegments: 2,
        maxDomainSegments: 4,
        tlds: { allow: ["com", "net"] },
      })
      .messages({
        "any.required": "Email is required",
        "string.empty": "not allowed to be empty",
        "string.base": "only string is allowed",
        "string.email": "please enter realy email",
      }),
    phone: joi.string().pattern(/^01[0125][0-9]{8}$/),
    gender: joi.string().allow("Male", "Female"),
    address: joi.string(),
    DOB: joi.date(),
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
