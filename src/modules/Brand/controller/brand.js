import slugify from "slugify";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";
import {
  create,
  findById,
  findOne,
  findOneAndUpdate,
} from "../../../../DB/DBMethods.js";
import brandModel from "../../../../DB/models/Brand.js";
import { nanoid } from "nanoid";
import ApiFeatures from "../../../utils/apiFeatures.js";

export const createBrand = asyncHandler(async (req, res, next) => {
  const { user } = req;
  req.body.name = req.body.name.toLowerCase();
  const { name } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const checkName = await findOne({
    model: brandModel,
    condition: { name },
    select: "name",
  });
  if (checkName) {
    return next(new Error("Dupplicate name", { cause: 409 }));
  }
  req.body.slug = slugify(name, {
    replacement: "-",
    lower: true,
    trim: true,
  });
  req.body.cloudId = nanoid();
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECTNAME}/brand/${req.body.cloudId}`,
    }
  );
  req.body.image = { secure_url, public_id };
  req.body.createdBy = user._id;
  const brand = await create({ model: brandModel, data: req.body });
  if (!brand) {
    await cloudinary.uploader.destroy(public_id);
    return next(new Error("Fail to create a new brand", { cause: 400 }));
  }
  return res.status(201).json({ message: "Done", brand });
});
export const updateBrand = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  const { name } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const brand = await findOne({
    model: brandModel,
    condition: { _id: id, createdBy: user._id },
    select: "name cloudId image",
  });
  if (!brand) {
    return next(new Error("In-valid brand", { cause: 404 }));
  }
  if (name) {
    req.body.name = req.body.name.toLowerCase();
    if (brand.name == req.body.name) {
      return next(
        new Error("You cannot update your name by the same name", {
          cause: 400,
        })
      );
    }
    const checkName = await findOne({
      model: brandModel,
      condition: { name: req.body.name },
      select: "name",
    });
    if (checkName) {
      return next(new Error("Dupplicate name", { cause: 409 }));
    }
    req.body.name = name.toLowerCase();
    req.body.slug = slugify(req.body.name, {
      replacement: "-",
      lower: true,
      trim: true,
    });
  }
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECTNAME}/brand/${brand.cloudId}`,
      }
    );
    req.body.image = { secure_url, public_id };
  }
  req.body.updatedBy = user._id
  const updateBrand = await findOneAndUpdate({
    model: brandModel,
    condition: { _id: id, createdBy: user._id },
    data: req.body,
  });
  if (!updateBrand) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.body.image.public_id);
    }
    return next(new Error("Fail to update Your brand", { cause: 404 }));
  }
  if (req.file) {
    await cloudinary.uploader.destroy(brand.image.public_id);
  }
  return res.status(200).json({ message: "Done" });
});
export const brands = asyncHandler(async (req, res, next) => {
  const populate = [
    {
      path: "createdBy",
      select: "userName email image",
    },
  ];
  const apiFeature = new ApiFeatures(
    req.query,
    brandModel.find().populate(populate)
  )
    .filter()
    .search()
    .select()
    .sort()
    .paginate();
  const brands = await apiFeature.mongooseQuery;
  if (!brands.length) {
    return next(new Error("In-valid brand", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", brands });
});
export const getBrandById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const populate = [
    {
      path: "createdBy",
      select: "userName email image",
    },
  ];
  const brand = await findById({
    model: brandModel,
    populate,
    condition: id,
  });
  if (!brand) {
    return next(new Error("In-valid brand", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", brand });
});