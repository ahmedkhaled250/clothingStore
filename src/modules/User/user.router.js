import { auth } from "../../middleware/auth.js";
import * as validators from "./user.validation.js";
import * as userController from "./controller/user.js";
import { Router } from "express";
import endPoint from "./user.endPoints.js";
import { fileValidation, myMulter } from "../../utils/multer.js";
import validation from "../../middleware/validation.js";
const router = Router();
router.patch(
  "/:id/acceptAdmin",
  validation(validators.superAdminAccessInUser),
  auth(endPoint.SuperAdmin),
  userController.acceptAdmin
);
router.patch(
  "/:id/refuseAdmin",
  validation(validators.superAdminAccessInUser),
  auth(endPoint.SuperAdmin),
  userController.refuseAdmin
);
router.patch(
  "/profilePic",
  myMulter(fileValidation.image).single("image"),
  validation(validators.profilePic),
  auth(endPoint.allUsers),
  userController.profilePic
);
router.patch(
  "/deleteProfilePic",
  validation(validators.token),
  auth(endPoint.allUsers),
  userController.deleteProfilePic
);
router.patch(
  "/updatePassword",
  validation(validators.updatePassword),
  auth(endPoint.allUsers),
  userController.updatePassword
);
router.patch(
  "/softDelete",
  validation(validators.token),
  auth(endPoint.allUsers),
  userController.softDelete
);
router.patch(
  "/:id/blockUser",
  validation(validators.blockUser),
  auth(endPoint.blockUser),
  userController.blockUser
);
router.get(
  "/profile",
  validation(validators.token),
  auth(endPoint.allUsers),
  userController.profile
);
router.get(
  "/:id",
  validation(validators.getUserById),
  userController.getUserById
);
router.get("/", userController.users);

export default router;
