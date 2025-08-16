import authRouter from "./Auth/auth.router.js";
import userRouter from "./User/user.router.js";
import categoryRouter from "./Category/category.router.js";
import subcategoryRouter from "./SubCategory/subcategory.router.js";
import brandRouter from "./Brand/brand.router.js";
import productRouter from "./Product/product.router.js";
import orderRouter from "./order/order.router.js";
import cartRouter from "./Cart/cart.router.js";
import couponRouter from "./Coupon/coupon.router.js";
import wishlistRouter from "./wishList/wishList.router.js";
import morgan from "morgan";
import { globalError } from "../utils/errorHandling.js";
import cors from "cors";
import superAdminFunction from "../utils/superAdmin.js";
const bootstrap = (app, express) => {
  app.use((req, res, next) => {
    if (req.originalUrl == "/order/webhook") {
      next();
    } else {
      express.json()(req, res, next);
    }
  });
  // Setup cors
  app.use(cors());
  // morgan check error
  if (process.env.MOOD == "DEV") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }
  // setup superAdmin account
  superAdminFunction();
  // Setup api routing
  app.use(`/auth`, authRouter);
  app.use(`/user`, userRouter);
  app.use(`/category`, categoryRouter);
  app.use(`/subcategory`, subcategoryRouter);
  app.use(`/brand`, brandRouter);
  app.use(`/product`, productRouter);
  app.use(`/cart`, cartRouter);
  app.use(`/order`, orderRouter);
  app.use(`/coupon`, couponRouter);
  app.use(`/wishlist`, wishlistRouter);
  app.use("*", (req, res) => {
    res.status(404).json({ message: "In-valid routing" });
  });
  // Error handling
  app.use(globalError);
  // Connection DB
};
export default bootstrap;
