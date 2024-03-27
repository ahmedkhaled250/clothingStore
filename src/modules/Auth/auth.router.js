import validation from "../../middleware/validation.js";
import * as validators from "./auth.validation.js";
import * as authController from "./controller/regiteration.js";
import endPoint from "./auth.endPoints.js";
import { Router } from "express";
import { auth } from "../../middleware/auth.js";
const router = Router();
router.post("/signup", validation(validators.signup), authController.signup);
router.post(
  "/createAccount",
  validation(validators.createAccount),
  auth(endPoint.createAccount),
  authController.createAccount
);
router.get(
  "/confirmEmail/:token",
  validation(validators.token),
  authController.confirmEmail
);
router.get(
  "/refreshEmail/:token",
  validation(validators.token),
  authController.refreshEmail
);
router.post("/signin", validation(validators.signin), authController.signin);
router.patch("/refreshToken/:token", validation(validators.token), authController.refreshToken);
router.patch(
  "/sendCode",
  validation(validators.sendCode),
  authController.sendCode
);
router.patch(
  "/forgetPassword",
  validation(validators.forgetPassword),
  authController.forgetPassword
);
export default router;
