import { asyncHandler } from "../../../utils/errorHandling.js";
import {
  create,
  find,
  findByIdAndDelete,
  findByIdAndUpdate,
  findOne,
  updateOne,
} from "../../../../DB/DBMethods.js";
import productModel from "../../../../DB/models/Product.js";
import reviewModel from "../../../../DB/models/Review.js";
import ApiFeatures from "../../../utils/apiFeatures.js";
import orderModel from "../../../../DB/models/Order.js";

export const addReview = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { productId } = req.params;
  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }
  const order = await findOne({
    model: orderModel,
    condition: {
      userId: user._id,
      "products.productId": productId,
      status: "received",
    },
  });
  if (!order) {
    return next(
      new Error("You cannot add a review before purchasing and receiving this product.", {
        cause: 400,
      })
    );
  }

  const checkReview = await findOne({
    model: reviewModel,
    condition: { productId, userId: user._id },
  });
  if (checkReview) {
    return next(
      new Error("Already, you added a review for this product", { cause: 409 })
    );
  }
  req.body.userId = user._id;
  req.body.productId = productId;
  const review = await create({ model: reviewModel, data: req.body });
  if (!review) {
    return next(new Error("Fail to add review", { cause: 400 }));
  }
  const reviews = await find({
    model: reviewModel,
    condition: { productId, deleted: false },
  });
  let sumRate = 0;
  for (const review of reviews) {
    sumRate += review.rating;
  }
  let avrRate = sumRate / reviews.length;
  avrRate = avrRate.toFixed(1);
  await findByIdAndUpdate({
    model: productModel,
    condition: productId,
    data: { rating: avrRate},
  });
  return res.status(201).json({ message: "Done", review });
});
export const updateReview = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { reviewId, productId } = req.params;
  const { rating } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }
  const updateReview = await findByIdAndUpdate({
    model: reviewModel,
    condition: { userId: user._id, _id: reviewId, productId },
    data: req.body,
  });
  if (!updateReview) {
    return next(new Error("In-valid review", { cause: 404 }));
  }
  if (rating) {
    const reviews = await find({
      model: reviewModel,
      condition: { productId: productId, deleted: false },
    });
    let sumRate = 0;
    for (const review of reviews) {
      sumRate += review.rating;
    }
    let avrRate = sumRate / reviews.length;
    avrRate = avrRate.toFixed(1);
    await updateOne({
      model: productModel,
      condition: { _id: updateReview.productId },
      data: { rating: avrRate },
    });
  }
  return res.status(200).json({ message: "Done" });
});
export const deleteReview = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { reviewId, productId } = req.params;
  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }
  const review = await findByIdAndDelete({
    model: reviewModel,
    condition: { userId: user._id, _id: reviewId, productId },
  });
  if (!review) {
    return next(new Error("In-valid review", { cause: 404 }));
  }
  const reviews = await find({
    model: reviewModel,
    condition: { productId, deleted: false },
  });
  if (!reviews.length) {
    await updateOne({
      model: productModel,
      condition: { _id: productId },
      data: { rating: null },
    });
  } else {
    let sumRate = 0;
    for (const review of reviews) {
      sumRate += review.rating;
    }
    let avrRate = sumRate / reviews.length;
    avrRate = avrRate.toFixed(1);
    await updateOne({
      model: productModel,
      condition: { _id: review.productId },
      data: { rating: avrRate },
    });
  }
  return res.status(200).json({ message: "Done" });
});
export const softDeleteReview = async (req, res, next) => {
  const { user } = req;
  const { reviewId, productId } = req.params;
  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }
  const review = await findOne({
    model: reviewModel,
    condition: { _id: reviewId, userId: user._id, productId },
  });
  if (!review) {
    return next(new Error("In-valid review", { cause: 404 }));
  }
  let updateReview;
  if (review.deleted) {
    updateReview = await updateOne({
      model: reviewModel,
      condition: { _id: review._id },
      data: { deleted: false },
    });
  } else {
    updateReview = await updateOne({
      model: reviewModel,
      condition: { _id: review._id },
      data: { deleted: true },
    });
  }
  if (!updateReview) {
    return next(new Error("Fail to soft delete your review", { cause: 400 }));
  } else {
    const reviews = await find({
      model: reviewModel,
      condition: { productId, deleted: false },
    });
    if (!reviews.length) {
      await updateOne({
        model: productModel,
        condition: { _id: productId },
        data: { rating: null },
      });
    } else {
      let sumRate = 0;
      for (const review of reviews) {
        sumRate += review.rating;
      }
      let avrRate = sumRate / reviews.length;
      avrRate = avrRate.toFixed(1);
      await updateOne({
        model: productModel,
        condition: { _id: productId },
        data: { rating: avrRate },
      });
    }
  }
  return res.status(200).json({ message: "Done" });
};
export const getReviewByProduct = async (req, res, next) => {
  const { productId } = req.params;
  const populate = [
    {
      path: "userId",
      select: "userName email image",
    },
    {
      path: "productId",
      populate: [
        {
          path: "createdBy",
          select: "userName email image",
        },
      ],
    },
  ];
  const apiFeature = new ApiFeatures(
    req.query,
    reviewModel.find({ productId, deleted: false }).populate(populate)
  )
    .filter()
    .paginate()
    .sort()
    .select()
    .search();
  const reviews = await apiFeature.mongooseQuery;
  if (!reviews.length) {
    return next(new Error("In-valid reviews", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", reviews });
};
export const review = async (req, res, next) => {
  const { productId, id } = req.params;
  const populate = [
    {
      path: "userId",
      select: "userName email image",
    },
    {
      path: "productId",
      populate: [
        {
          path: "createdBy",
          select: "userName email image",
        },
      ],
    },
  ];
  const reviews = await findOne({
    model: reviewModel,
    condition: { productId, deleted: false, _id: id },
    populate,
  });
  if (!reviews) {
    return next(new Error("In-valid review", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", reviews });
};
