import { asyncHandler } from "../../../utils/errorHandling.js";
import {
  create,
  findById,
  findByIdAndUpdate,
  findOne,
} from "../../../../DB/DBMethods.js";
import couponModel from "../../../../DB/models/Coupon.js";
import ApiFeatures from "../../../utils/apiFeatures.js";

export const createCoupon = asyncHandler(async (req, res, next) => {
  const { user } = req;
  req.body.name = req.body.name.toLowerCase();
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const checkName = await findOne({
    model: couponModel,
    condition: { name: req.body.name },
    select: "name",
  });
  if (checkName) {
    return next(new Error("Dupplicate name", { cause: 409 }));
  }
  req.body.createdBy = user._id;
  const coupon = await create({ model: couponModel, data: req.body });
  if (!coupon) {
    return next(new Error("Fail to create a new coupon", { cause: 400 }));
  }
  return res.status(201).json({ message: "Done", coupon });
});

export const updateCoupon = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  const { name } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const checkCoupon = await findById({ model: couponModel, condition: id });
  if (!checkCoupon) {
    return next(new Error("In-valid coupon", { cause: 404 }));
  }
  if (name) {
    req.body.name = name.toLowerCase();
    if (req.body.name == checkCoupon.name) {
      return next(
        new Error("You cannot update coupon name by the same name", {
          cause: 400,
        })
      );
    }
    const checkName = await findOne({
      model: couponModel,
      condition: { name: req.body.name },
      select: "name",
    });
    if (checkName) {
      return next(new Error("Dupplicate name", { cause: 409 }));
    }
  }
  req.body.updatedBy = user._id;
  const coupon = await findByIdAndUpdate({
    model: couponModel,
    condition: id,
    data: req.body,
  });
  if (!coupon) {
    return next(new Error("Fail to update this coupon", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done" });
});
export const softDeleteCoupon = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const coupon = await findById({ model: couponModel, condition: id });
  if (!coupon) {
    return next(new Error("In-valid coupon", { cause: 404 }));
  }
  if (coupon.deleted) {
    coupon.deleted = false;
    coupon.deletedBy = null;
  } else {
    coupon.deleted = true;
    coupon.deletedBy = user._id;
  }
  await coupon.save();
  return res.status(200).json({ message: "Done" });
});
export const coupons = asyncHandler(async (req, res, next) => {
  const { user } = req;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const populate = [
    {
      path: "createdBy",
      select: "userName email image",
    },
    {
      path: "updatedBy",
      select: "userName email image",
    },
    {
      path: "deletedBy",
      select: "userName email image",
    },
  ];
  const apiFeature = new ApiFeatures(
    req.query,
    couponModel.find().populate(populate)
  )
    .filter()
    .paginate()
    .search()
    .select()
    .sort();
  const coupons = await apiFeature.mongooseQuery;
  if (!coupons.length) {
    return next(new Error("In-valid coupon", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", coupons });
});
export const coupon = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const populate = [
    {
      path: "createdBy",
      select: "userName email image",
    },
    {
      path: "updatedBy",
      select: "userName email image",
    },
    {
      path: "deletedBy",
      select: "userName email image",
    },
  ];
  const coupon = await findById({
    model: couponModel,
    condition: id,
    populate,
  });
  if (!coupon) {
    return next(new Error("In-valid coupon", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", coupon });
});
