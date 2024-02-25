import userModel from "../../DB/models/User.js";
import { findById } from "../../DB/DBMethods.js";
import { asyncHandler } from "../utils/errorHandling.js";
import { verifyToken } from "../utils/GenerateAndVerifyToken.js";
export const roles = {
  User: "User",
  Admin: "Admin",
  SuperAdmin: "SuperAdmin",
};
export const auth = (accessRoles = []) => {
  return asyncHandler(async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization.startsWith(process.env.BARERKEY)) {
      return next(new Error("In-valid barer key", { cause: 400 }));
    }
    const token = authorization.split(process.env.BARERKEY)[1];
    const decoded = verifyToken({
      token,
      signature: process.env.TOKINSEGNITURE,
    });
    if (!decoded?.id) {
      return next(new Error("In-valid token payload", { cause: 400 }));
    }
    const user = await findById({
      model: userModel,
      condition: decoded.id,
      select: "-password",
    });
    if (!user) {
      return next(new Error("In-valid user", { cause: 404 }));
    }
    const expireDate = parseInt(user.changeTime?.getTime() / 1000);
    if (expireDate > decoded.iat) {
      return next(new Error("Expire token", { cause: 400 }));
    }
    if (user.status == "blocked") {
      return next(new Error("Your account is blocked", { cause: 400 }));
    }
    if (user.status == "offline") {
      return next(new Error("Please, login"));
    }
    if (!accessRoles.includes(user.role)) {
      return next(new Error("Not authorized user", { cause: 403 }));
    }
    req.user = user;
    return next();
  });
};
