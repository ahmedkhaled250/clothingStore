import { auth } from "../../middleware/auth.js";
import validation from "../../middleware/validation.js";
import endPoint from "./review.endpoints.js";
import * as validators from "./review.validation.js";
import * as orderController from "./controller/review.js";
import { Router } from "express";
const router = Router({ mergeParams: true });
router.post(
  "/",
  validation(validators.addReview),
  auth(endPoint.review),
  orderController.addReview
);
router.put(
  "/:reviewId",
  validation(validators.updateReview),
  auth(endPoint.review),
  orderController.updateReview
);
router.delete(
  "/:reviewId",
  validation(validators.deleteReview),
  auth(endPoint.review),
  orderController.deleteReview
);
router.patch(
  "/:reviewId",
  validation(validators.deleteReview),
  auth(endPoint.review),
  orderController.softDeleteReview
);
router.get(
  "/",
  validation(validators.productId),
  orderController.getReviewByProduct
);
router.get("/:id", validation(validators.review), orderController.review);
export default router;
