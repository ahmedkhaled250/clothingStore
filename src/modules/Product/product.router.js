import { auth } from "../../middleware/auth.js";
import validation from "../../middleware/validation.js";
import { fileValidation, myMulter } from "../../utils/multer.js";
import endPoint from "./product.endPoints.js";
import * as validators from "./product.validation.js";
import * as productController from "./controller/product.js";
import cartRouter from "../Cart/cart.router.js";
import reviewRouter from "../review/review.router.js";
import wishList from "../wishList/wishList.router.js";
import { Router } from "express";
const router = Router({ mergeParams: true });
router.use("/:productId/cart", cartRouter);
router.use("/:productId/review", reviewRouter);
router.use("/:productId/wishList", wishList);
router.post(
  "/",
  myMulter(fileValidation.image).array("images", 5),
  validation(validators.createProduct),
  auth(endPoint.product),
  productController.createProduct
);
router.put(
  "/:id",
  myMulter(fileValidation.image).array("images", 5),
  validation(validators.updateProduct),
  auth(endPoint.product),
  productController.updateProduct
);
router.delete(
  "/:id",
  validation(validators.IdAndHeaders),
  auth(endPoint.product),
  productController.deleteProduct
);
router.patch(
  "/:id",
  validation(validators.IdAndHeaders),
  auth(endPoint.product),
  productController.softDeleteProduct
);
router.get("/", validation(validators.products), productController.products);
router.get(
  "/myProducts",
  validation(validators.myProducts),
  auth(endPoint.product),
  productController.MyProducts
);
router.get(
  "/productsOfSpecificSubcategory",
  validation(validators.productsOfSpecificSubcategory),
  productController.productsOfSpecificSubcategory
);
router.get(
  "/productsOfSpecificCategory",
  validation(validators.productsOfSpecificCategory),
  productController.productsOfSpecificCategory
);
router.get(
  "/:id",
  validation(validators.getProductById),
  productController.getProductById
);
router.get(
  "/:id/getMyProductById",
  validation(validators.IdAndHeaders),
  auth(endPoint.product),
  productController.getMyProductById
);
export default router;
