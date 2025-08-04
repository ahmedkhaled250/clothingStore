import { auth } from "../../middleware/auth.js";
import validation from "../../middleware/validation.js";
import endPoint from "./order.endpoints.js";
import * as validators from "./order.validation.js";
import * as orderController from "./controller/order.js";
import express, { Router } from "express";
const router = Router({ mergeParams: true });
router.post(
  "/",
  validation(validators.addOrder),
  auth(endPoint.order),
  orderController.addOrder
);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  orderController.webhook
);
router.patch(
  "/:id/cencelOrder",
  validation(validators.cencelOrder),
  auth(endPoint.order),
  orderController.cencelOrder
);
router.patch(
  "/:id/updateStatus",
  validation(validators.updateStatus),
  auth(endPoint.updateStatus),
  orderController.updateStatus
);
router.get(
  "/",
  validation(validators.userOrders),
  auth(endPoint.order),
  orderController.userOrders
);
export default router;
