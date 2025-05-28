import slugify from "slugify";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";
import {
  create,
  findById,
  findByIdAndDelete,
  findOne,
  findOneAndUpdate,
} from "../../../../DB/DBMethods.js";
import brandModel from "../../../../DB/models/Brand.js";
import productModel from "../../../../DB/models/Product.js";
import subcategoryModel from "../../../../DB/models/Subcategory.js";
import { nanoid } from "nanoid";
import sendEmail from "../../../utils/sendEmail.js";
import userModel from "../../../../DB/models/User.js";
import ApiFeatures from "../../../utils/apiFeatures.js";

export const createProduct = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { name, price, discound, brandId, categoryId, subcategoryId } =
    req.body;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const subcategory = await findOne({
    model: subcategoryModel,
    condition: { _id: subcategoryId, categoryId },
  });
  if (!subcategory) {
    return next(
      new Error("In-valid subcategoryId or categoryId", { cause: 404 })
    );
  }
  const brand = await findOne({
    model: brandModel,
    condition: { _id: brandId },
  });
  if (!brand) {
    return next(new Error("In-valid brandId", { cause: 404 }));
  }
  req.body.categoryId = categoryId;
  req.body.totalAmount = req.body.stock;
  req.body.subcategoryId = subcategoryId;
  req.body.brandId = brandId;
  req.body.createdBy = user._id;
  req.body.name = name.toLowerCase();
  req.body.slug = slugify(req.body.name, {
    replacement: "-",
    lower: true,
    trim: true,
  });
  req.body.finalPrice = Number.parseFloat(
    price - price * ((discound || 0) / 100)
  ).toFixed(2);
  req.body.cloudId = nanoid();
  const images = [];
  console.log(req.files);

  for (const file of req.files) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `${process.env.PROJECTNAME}/product/${req.body.cloudId}/images`,
      }
    );
    images.push({ secure_url, public_id });
  }
  req.body.images = images;
  const product = await create({ model: productModel, data: req.body });
  if (!product) {
    for (const image of req.body.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }
    return next(new Error("Fail to create a new product", { cause: 400 }));
  }
  return res.status(201).json({ message: "Done", product });
});
export const updateProduct = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  const {
    price,
    discound,
    stock,
    replaceImages,
    imageId,
    categoryId,
    subcategoryId,
    brandId,
  } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const product = await findOne({
    model: productModel,
    condition: { _id: id, createdBy: user._id },
  });
  if (!product) {
    return next(new Error("In-valid product", { cause: 404 }));
  }
  if (req.body.name) {
    req.body.name = req.body.name.toLowerCase();
    req.body.slug = slugify(req.body.name, {
      replacement: "-",
      lower: true,
      trim: true,
    });
  }
  if (stock) {
    req.body.stock = Number(req.body.stock) + Number(product.stock)
    req.body.totalAmount = Number(req.body.stock) + Number(product.soldItems)
    if (product.wishUserList.length) {
      for (const id of product.wishUserList) {
        const user = await findById({
          model: userModel,
          condition: id,
          select: "userName email",
        });
        if (user?.status != "blocked") {
          const link = `${req.protocol}://${req.headers.host}/product/${product.id}`;
          const message = `
            <p>
            Hello ${user.userName} <br>
            There was a product you tried to buy it but there wasn't the quantity that you wanted <br>
            There are some products of this product have added into the stock <br>
            The product name is ${product.name}, <br>
            The product image is ${product.images[0].secure_url} <br>
            <a href="${link}">Click here to go for this product </a>
            </p>
            `;
          const info = await sendEmail({
            to: user.email,
            subject: "favorite product",
            message,
          });
          if (info) {
            const index = product.wishUserList.indexOf(id);
            product.wishUserList.splice(index, 1);
          }
        }
      }
    }
  }
  req.body.wishUserList = product.wishUserList;
  if (price && discound) {
    req.body.finalPrice = Number.parseFloat(
      price - price * (discound / 100)
    ).toFixed(2);
  } else if (price) {
    req.body.finalPrice = Number.parseFloat(
      price - price * (product.discound / 100)
    ).toFixed(2);
  } else if (discound) {
    req.body.finalPrice = Number.parseFloat(
      product.price - product.price * (discound / 100)
    ).toFixed(2);
  }
  const imagesIdsUplaoded = [];
  if (replaceImages) {
    if (req.files?.length) {
      const images = [];
      for (const file of req.files) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          file.path,
          {
            folder: `${process.env.PROJECTNAME}/product/${product.cloudId}/images`,
          }
        );
        images.push({ secure_url, public_id });
      }
      req.body.images = images;
    }
  } else {
    if (imageId) {
      const length = product.images.length;
      for (const image of product.images) {
        if (imageId == image.public_id.toString()) {
          const indexOfImage = product.images.indexOf(image);
          product.images.splice(indexOfImage, 1);
          req.body.images = product.images;
          break;
        }
      }
      if (length - product.images.length != 1) {
        return next(
          new Error("This image is not defined in those product images", {
            cause: 400,
          })
        );
      }
      if (req.files?.length) {
        if (req.body.images.length + req.files.length <= 5) {
          for (const file of req.files) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(
              file.path,
              {
                folder: `${process.env.PROJECTNAME}/product/${product.cloudId}/images`,
              }
            );
            imagesIdsUplaoded.push(public_id);
            req.body.images.push({ secure_url, public_id });
          }
        } else {
          return next(
            new Error("You cannot add more 5 photos", { cause: 400 })
          );
        }
      }
    } else {
      if (req.files?.length) {
        if (product.images.length + req.files.length <= 5) {
          for (const file of req.files) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(
              file.path,
              {
                folder: `${process.env.PROJECTNAME}/product/${product.cloudId}/images`,
              }
            );
            imagesIdsUplaoded.push(public_id);
            product.images.push({ secure_url, public_id });
          }
          req.body.images = product.images;
        } else {
          return next(
            new Error("You cannot add more 5 photos", { cause: 400 })
          );
        }
      }
    }
  }
  let subcategory;
  if (categoryId && subcategoryId) {
    subcategory = await findOne({
      model: subcategoryModel,
      condition: { categoryId, _id: subcategoryId },
    });
    if (!subcategory) {
      return next(
        new Error("this subcategory  is not suitable for this category", {
          cause: 400,
        })
      );
    }
    req.body.categoryId = categoryId;
    req.body.subcategoryId = subcategoryId;
  } else if (subcategoryId) {
    subcategory = await findOne({
      model: subcategoryModel,
      condition: { categoryId: product.categoryId, _id: subcategoryId },
    });
    if (!subcategory) {
      return next(
        new Error("this subcategory  is not suitable for this category", {
          cause: 400,
        })
      );
    }
    req.body.subcategoryId = subcategoryId;
  } else if (categoryId) {
    return next(
      new Error("You can't change category without subcategory", { cause: 400 })
    );
  }
  if (brandId) {
    const brand = await findById({ model: brandModel, condition: brandId });
    if (!brand) {
      return next(
        new Error("In-valid brandId", {
          cause: 404,
        })
      );
    }
    req.body.brandId = brandId;
  }
  const updateProduct = await findOneAndUpdate({
    model: productModel,
    condition: { _id: id, createdBy: user._id },
    data: req.body,
  });
  if (!updateProduct) {
    if (req.files?.length) {
      if (replaceImages) {
        for (const image of req.body.images) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      } else {
        for (const id of imagesIdsUplaoded) {
          await cloudinary.uploader.destroy(id);
        }
      }
    }
    return next(new Error("Fail to update product", { cause: 400 }));
  }
  if (imageId) {
    await cloudinary.uploader.destroy(imageId);
  }
  if (req.files?.length) {
    if (replaceImages) {
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }
  }
  return res.status(200).json({ message: "Done" });
});
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const deleteProduct = await findByIdAndDelete({
    model: productModel,
    condition: { _id: id, createdBy: user._id },
  });
  if (!deleteProduct) {
    return next(new Error("In-valid product", { cause: 404 }));
  }
  for (const image of deleteProduct.images) {
    await cloudinary.uploader.destroy(image.public_id);
  }
  return res.status(200).json({ message: "Done" });
});
export const softDeleteProduct = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  const product = await findOne({
    model: productModel,
    condition: { _id: id, createdBy: user._id },
  });
  if (!product) {
    return next(new Error("In-valid product", { cause: 404 }));
  }
  if (product.deleted) {
    product.deleted = false;
  } else {
    product.deleted = true;
  }
  await product.save();
  return res.status(200).json({ message: "Done" });
});
export const products = async (req, res, next) => {
  const populate = [
    {
      path: "createdBy",
      select: "userName email image",
    },
    {
      path: "categoryId",
      select: "name image",
    },
    {
      path: "review",
      select: "rating message userId",
      populate: { path: "userId", select: "userName email image " },
    },
    {
      path: "subcategoryId",
      select: "name image",
    },
    {
      path: "brandId",
      select: "name image",
    },
  ];
  const apiFeature = new ApiFeatures(
    req.query,
    productModel.find({ deleted: false }).populate(populate)
  )
    .paginate()
    .filter()
    .sort()
    .search()
    .select();
  const products = await apiFeature.mongooseQuery;
  if (!products.length) {
    return next(new Error("In-valid products", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", products });
};
export const MyProducts = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const populate = [
    {
      path: "createdBy",
      select: "userName email image",
    },
    {
      path: "categoryId",
      select: "name image",
    },
    {
      path: "subcategoryId",
      select: "name image",
    },
    {
      path: "brandId",
      select: "name image",
    },
    {
      path: "review",
      select: "rating message userId",
      populate: { path: "userId", select: "userName email image " },
    },
  ];
  const apiFeature = new ApiFeatures(
    req.query,
    productModel.find({ createdBy: user._id }).populate(populate)
  )
    .filter()
    .paginate()
    .sort()
    .select()
    .search();
  const products = await apiFeature.mongooseQuery;
  if (!products.length) {
    return next(new Error("In-valid products", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", products });
});
export const getProductById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const populate = [
    {
      path: "createdBy",
      select: "userName email image",
    },
    {
      path: "categoryId",
      select: "name image",
    },
    {
      path: "subcategoryId",
      select: "name image",
    },
    {
      path: "brandId",
      select: "name image",
    },
    {
      path: "review",
      select: "rating message userId",
      populate: { path: "userId", select: "userName email image " },
    },
  ];
  const product = await findOne({
    model: productModel,
    populate,
    condition: { _id: id, deleted: false },
  });
  if (!product) {
    return next(new Error("In-valid product", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", product });
});
export const getMyProductById = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  const populate = [
    {
      path: "createdBy",
      select: "userName email image",
    },
    {
      path: "categoryId",
      select: "name image",
    },
    {
      path: "subcategoryId",
      select: "name image",
    },
    {
      path: "brandId",
      select: "name image",
    },
    {
      path: "review",
      select: "rating message userId",
      populate: { path: "userId", select: "userName email image " },
    },
  ];
  const product = await findOne({
    model: productModel,
    populate,
    condition: { _id: id, createdBy: user._id },
  });
  if (!product) {
    return next(new Error("In-valid product", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", product });
});
export const productsOfSpecificSubcategory = asyncHandler(
  async (req, res, next) => {
    const { subcategoryId } = req.params;
    const populate = [
      {
        path: "createdBy",
        select: "userName email image",
      },
      {
        path: "categoryId",
        select: "name image",
      },
      {
        path: "subcategoryId",
        select: "name image",
      },
      {
        path: "brandId",
        select: "name image",
      },
      {
        path: "review",
        select: "rating message userId",
        populate: { path: "userId", select: "userName email image " },
      },
    ];
    const apiFeature = new ApiFeatures(
      req.query,
      productModel.find({ subcategoryId }).populate(populate)
    )
      .filter()
      .paginate()
      .sort()
      .select()
      .search();
    const products = await apiFeature.mongooseQuery;
    if (!products.length) {
      return next(new Error("In-valid products", { cause: 404 }));
    }
    return res.status(200).json({ message: "Done", products });
  }
);
export const productsOfSpecificCategory = asyncHandler(
  async (req, res, next) => {
    const { categoryId } = req.params;
    const populate = [
      {
        path: "createdBy",
        select: "userName email image",
      },
      {
        path: "categoryId",
        select: "name image",
      },
      {
        path: "subcategoryId",
        select: "name image",
      },
      {
        path: "brandId",
        select: "name image",
      },
      {
        path: "review",
        select: "rating message userId",
        populate: { path: "userId", select: "userName email image " },
      },
    ];
    const apiFeature = new ApiFeatures(
      req.query,
      productModel.find({ categoryId }).populate(populate)
    )
      .filter()
      .paginate()
      .sort()
      .select()
      .search();
    const products = await apiFeature.mongooseQuery;
    if (!products.length) {
      return next(new Error("In-valid products", { cause: 404 }));
    }
    return res.status(200).json({ message: "Done", products });
  }
);