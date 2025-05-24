import { auth } from "../../middleware/auth.js";
import validation from "../../middleware/validation.js";
import endPoint from "./coupon.endpoints.js";
import * as validators from "./coupon.validation.js";
import * as couponController from "./controller/coupon.js";
import { Router } from "express";
const router = Router();
router.post(
  "/",
  validation(validators.createCoupon),
  auth(endPoint.coupon),
  couponController.createCoupon
);
router.put(
  "/:id",
  validation(validators.updateCoupon),
  auth(endPoint.coupon),
  couponController.updateCoupon
);
router.patch(
  "/:id",
  validation(validators.softDeleteCoupon),
  auth(endPoint.coupon),
  couponController.softDeleteCoupon
);
router.get(
  "/",
  validation(validators.coupons),
  auth(endPoint.coupon),
  couponController.coupons
);
router.get(
  "/:id",
  validation(validators.coupon),
  couponController.coupon
);
export default router;
