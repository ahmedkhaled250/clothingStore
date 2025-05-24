import { auth } from "../../middleware/auth.js";
import validation from "../../middleware/validation.js";
import endPoint from "./cart.endpoints.js";
import * as validators from "./cart.validation.js";
import * as cartController from "./controller/cart.js";
import { Router } from "express";
const router = Router({ mergeParams: true });
router.post(
  "/",
  validation(validators.addtoCart),
  auth(endPoint.cart),
  cartController.addtoCart
);
router.put(
  "/:id",
  validation(validators.removeProductsFromCart),
  auth(endPoint.cart),
  cartController.removeProductsFromCart
);
router.patch(
  "/:cartId",
  validation(validators.deleteFromCart),
  auth(endPoint.cart),
  cartController.deleteFromCart
);
router.get(
  "/",
  validation(validators.getMyCart),
  auth(endPoint.cart),
  cartController.getMyCart
);
export default router;
