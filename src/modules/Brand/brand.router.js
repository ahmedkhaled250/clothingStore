import { auth } from "../../middleware/auth.js";
import validation from "../../middleware/validation.js";
import { fileValidation, myMulter } from "../../utils/multer.js";
import endPoint from "./brand.endpoints.js";
import * as validators from "./brand.validation.js";
import * as brandController from "./controller/brand.js";
import { Router } from "express";
const router = Router();

router.post(
  "/",
  myMulter(fileValidation.image).single("image"),
  validation(validators.createBrand),
  auth(endPoint.brand),
  brandController.createBrand
);

router.put(
  "/:id",
  myMulter(fileValidation.image).single("image"),
  validation(validators.updateBrand),
  auth(endPoint.brand),
  brandController.updateBrand
);

router.get("/", validation(validators.brands), brandController.brands);

router.get(
  "/:id",
  validation(validators.getBrandById),
  brandController.getBrandById
);

export default router;
