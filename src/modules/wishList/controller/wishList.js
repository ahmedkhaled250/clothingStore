import { countDocuments, create, find, findById, findByIdAndDelete, findByIdAndUpdate, findOne, findOneAndUpdate, updateOne } from "../../../../DB/DBMethods.js";
import productModel from "../../../../DB/models/Product.js";
import userModel from "../../../../DB/models/User.js";
import wishlistModel from "../../../../DB/models/wishlist.js";
import ApiFeatures from "../../../utils/apiFeatures.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
export const add = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { productId } = req.params;

  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }

  const checkWishlist = await findOne({
    model: wishlistModel,
    condition: { userId: user._id, product: productId }
  })

  const total = await countDocuments({
    model: wishlistModel,
  });

  if (checkWishlist) {
    return res.status(200).json({ message: "Done", numberOfWishList: total });
  }

  const product = await findById({
    model: productModel,
    condition: productId,
  });

  if (!product) {
    return next(new Error("In-valid product ID", { cause: 404 }));
  }

  await create({
    model: wishlistModel,
    data: { userId: user._id, product: productId },
  });
  return res.status(200).json({ message: "Done", numberOfWishList: total + 1 });
});
export const remove = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { productId } = req.params;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const wishlist = await findOne({ model: wishlistModel, condition: { userId: user._id, product: productId } })

  const total = await countDocuments({
    model: wishlistModel,
  });

  if (!wishlist) {
    return res.status(200).json({ message: "Done", numberOfWishList: total });

  }


  const product = await findById({
    model: productModel,
    condition: productId,
  });

  if (!product) {
    return next(new Error("In-valid product ID", { cause: 404 }));
  }


  await findByIdAndDelete({
    model: wishlistModel,
    condition: wishlist._id,
  });

  return res.status(200).json({ message: "Done", numberOfWishList: total - 1 });
});
export const wishlistIds = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const wishlist = await find({ model: wishlistModel, condition: { userId: user._id }, select: "product -_id" })
  return res.status(200).json({ message: "Done", wishlist });
});
export const wishlist = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const populate = [
    {
      path: "product"
    }
  ]
  const apiFeature = new ApiFeatures(
    req.query,
    wishlistModel.find({ userId: user._id }).populate(populate).select("product -_id")
  ).paginate()

  const wishlist = await apiFeature.mongooseQuery;
  return res.status(200).json({ message: "Done", wishlist });
});
