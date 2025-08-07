import slugify from "slugify";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";
import { nanoid } from "nanoid";
import {
  countDocuments,
  create,
  find,
  findById,
  findOne,
  findOneAndUpdate,
} from "../../../../DB/DBMethods.js";
import categoryModel from "../../../../DB/models/Category.js";
import paginate from "../../../utils/paginate.js";

export const createCategory = asyncHandler(async (req, res, next) => {
  const { user } = req;
  req.body.name = req.body.name.toLowerCase();
  const { name } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const checkName = await findOne({
    model: categoryModel,
    condition: { name },
    select: "name",
  });
  if (checkName) {
    return next(new Error("Dupplicate name", { cause: 409 }));
  }
  req.body.slug = slugify(req.body.name, {
    replacement: "-",
    lower: true,
    trim: true,
  });
  const cloudId = nanoid(5);
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECTNAME}/category/${cloudId}`,
    }
  );
  req.body.cloudId = cloudId;
  req.body.image = { secure_url, public_id };
  req.body.createdBy = user._id;
  const category = await create({ model: categoryModel, data: req.body });
  if (!category) {
    await cloudinary.uploader.destroy(public_id);
    return next(new Error("Fail to create a new category", { cause: 400 }));
  }
  return res.status(201).json({ message: "Done", category });
});
export const updateCategory = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  const { name } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const category = await findOne({
    model: categoryModel,
    condition: { _id: id},
  });
  if (!category) {
    return next(new Error("In-valid category", { cause: 404 }));
  }
  if (name) {
    req.body.name = req.body.name.toLowerCase();
    if (req.body.name == category.name) {
      return next(
        new Error("Sory, you cannot update the name by the same name", {
          cause: 400,
        })
      );
    }
    const checkName = await findOne({
      model: categoryModel,
      condition: { name: req.body.name },
      select: "name",
    });
    if (checkName) {
      return next(new Error("Dupplicate name", { cause: 409 }));
    }
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
        folder: `${process.env.PROJECTNAME}/category/${category.cloudId}`,
      }
    );
    req.body.image = { secure_url, public_id };
  }
  req.body.updatedBy = user._id
  const updateCategory = await findOneAndUpdate({
    model: categoryModel,
    condition: { _id: category._id},
    data: req.body,
    option: { new: true },
  });
  if (!updateCategory) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.body.image.public_id);
    }
    return next(new Error("In-valid category", { cause: 404 }));
  }
  if (req.file) {
    await cloudinary.uploader.destroy(category.image.public_id);
  }
  return res.status(200).json({ message: "Done" });
});
export const categories = asyncHandler(async (req, res, next) => {
  const { skip, limit } = paginate({
    page: req.query.page,
    size: req.query.size,
  });
  const populate = [
    {
      path: "createdBy",
      select: "userName email image",
    },
    {
      path: "subcategory",
      select: "name image",
    },
  ];
  const categories = await find({
    model: categoryModel,
    populate,
    skip,
    limit,
  });
  const total = await countDocuments({
    model: categoryModel,
  });
  if (!total) {
    return next(new Error("In-valid category", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", categories, total });
});
export const getCategoryById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const populate = [
    {
      path: "createdBy",
      select: "userName email image",
    },
    {
      path: "subcategory",
      select: "name image",
    },
  ];
  const category = await findById({
    model: categoryModel,
    populate,
    condition: id,
  });
  if (!category) {
    return next(new Error("In-valid category", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", category });
});
