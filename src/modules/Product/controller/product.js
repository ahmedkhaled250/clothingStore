import slugify from "slugify";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";
import {
  create,
  find,
  findById,
  findByIdAndDelete,
  findOne,
  findOneAndUpdate,
  insertMany,
  countDocuments,
} from "../../../../DB/DBMethods.js";
import brandModel from "../../../../DB/models/Brand.js";
import productModel from "../../../../DB/models/Product.js";
import subcategoryModel from "../../../../DB/models/Subcategory.js";
import { nanoid } from "nanoid";
import sendEmail from "../../../utils/sendEmail.js";
import userModel from "../../../../DB/models/User.js";
import ApiFeatures from "../../../utils/apiFeatures.js";
import colorModel from "../../../../DB/models/Colors.js";

export const createProduct = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { name, price, discount, brandId, categoryId, subcategoryId, colors } =
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
  req.body.brandId = brandId;
  req.body.subcategoryId = subcategoryId;
  req.body.createdBy = user._id;

  req.body.cloudId = nanoid();
  let totalStock = 0
  let allSizes = []
  const imageIds = []
  const colorNames = []
  const colorCodes = []

  const processedColors = await Promise.all(colors.map(async (colorItem) => {

    if (colorNames.includes(colorItem.name) || colorCodes.includes(colorItem.code)) {
      return next(new Error("Don't repeat the colors"))
    }

    colorNames.push(colorItem.name)
    colorCodes.push(colorItem.code)

    // Get main image for this color
    const mainImageFile = req.files.find(file => file.fieldname == `mainImage[${colors.indexOf(colorItem)}]`)

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      mainImageFile.path,
      {
        folder: `${process.env.PROJECTNAME}/product/${req.body.cloudId}/${colorItem.name}/mainImage`,
      }
    );
    imageIds.push(public_id)
    const mainImage = { secure_url, public_id }
    // Get additional images for this color
    const colorImages = req.files.filter(file => file.fieldname == `images[${colors.indexOf(colorItem)}]`)


    const images = [];
    for (const file of colorImages) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `${process.env.PROJECTNAME}/product/${req.body.cloudId}/${colorItem.name}/images`,
        }
      );
      imageIds.push(public_id)
      images.push({ secure_url, public_id });
    }


    let totalColorStock = 0

    colorItem.sizes.map(item => {
      totalStock += parseInt(item.stock)
      totalColorStock += parseInt(item.stock)
    })

    return {
      name: colorItem.name,
      code: colorItem.code,
      sizes: colorItem.sizes.map(item => {
        if (!allSizes.includes(item.size.toLowerCase())) allSizes.push(item.size.toLowerCase())
        return {
          size: item.size.toLowerCase(),
          stock: parseInt(item.stock),
          totalAmount: parseInt(item.stock)
        }
      }),
      stock: totalColorStock,
      totalAmount: totalColorStock,
      mainImage: mainImage,
      images: images
    };
  }));


  const colorsCreated = await insertMany({ model: colorModel, data: processedColors });

  req.body.colors = colorsCreated.map(color => color._id)


  req.body.allSizes = allSizes
  req.body.totalStock = totalStock
  req.body.totalAmount = totalStock

  req.body.name = name.toLowerCase();
  req.body.slug = slugify(req.body.name, {
    replacement: "-",
    lower: true,
    trim: true,
  });

  req.body.finalPrice = Number.parseFloat(
    price - price * ((discount || 0) / 100)
  ).toFixed(2);

  const product = await create({ model: productModel, data: req.body });

  if (!product) {
    for (const id of imageIds) {
      await cloudinary.uploader.destroy(id);
    }
    return next(new Error("Fail to create a new product", { cause: 400 }));
  }
  return res.status(201).json({ message: "Done", product });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const { user } = req
  const { id } = req.params
  const {
    price,
    discount,
    // replaceImages,
    // imageId,
    categoryId,
    subcategoryId,
    brandId,
    colors,
    // stock
  } = req.body;

  if (!colors && req.files.length) {
    return next(new Error("You must send a specefic color id whith images", { cause: 400 }))
  }

  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }

  const populate = [
    {
      path: "colors",
      select: "-createdAt -updatedAt",
    },
  ];

  const product = await findOne({ model: productModel, condition: { _id: id }, populate })
  if (!product) {
    return next(new Error("In-valid product", { cause: 404 }))
  }


  if (req.body.name) {
    req.body.name = req.body.name.toLowerCase();
    req.body.slug = slugify(req.body.name, {
      replacement: "-",
      lower: true,
      trim: true,
    });
  }


  let totalStock = 0
  const imageIds = []
  const oldImageIds = []
  const colorNames = []
  const colorCodes = []

  async function updateColorsWithSpecificSizes(colorDataArray) {
    const bulkOps = [];

    colorDataArray.forEach(colorItem => {
      // First update the main color properties and increment total stock
      bulkOps.push({
        updateOne: {
          filter: { _id: colorItem.id },
          update: {
            $set: {
              ...(colorItem.name && { name: colorItem.name }),
              ...(colorItem.code && { code: colorItem.code }),
              ...(colorItem.mainImage?.secure_url && { mainImage: colorItem.mainImage }),
              ...(colorItem.images?.length && { images: colorItem.images }),
            },
            $inc: {
              stock: colorItem.stock,
              totalAmount: colorItem.stock
            }
          }
        }
      });

      // Then increment stock for each size individually
      colorItem.sizes.forEach(size => {
        bulkOps.push({
          updateOne: {
            filter: {
              _id: colorItem.id,
              "sizes._id": size._id
            },
            update: {
              $inc: {
                "sizes.$.stock": parseInt(size.stock) || 0,
                "sizes.$.totalAmount": parseInt(size.stock) || 0
              }
            }
          }
        });
      });
    });

    const result = await colorModel.bulkWrite(bulkOps, { ordered: false });
    return result;
  }

  if (colors) {
    const processedColors = await Promise.all(colors.map(async (colorItem) => {
      let checkError = false

      if (colorItem.name) {
        if (colorNames.includes(colorItem.name)) {
          return next(new Error("Don't repeat the colors", { cause: 400 }))
        }
        if (product.colors.find(color => color.name == colorItem.name)) {
          return next(new Error(`this color name (${colorItem.name}) is already exist`, { cause: 400 }))
        }
        colorNames.push(colorItem.name)
      }
      if (colorItem.code) {
        if (colorCodes.includes(colorItem.code)) {
          return next(new Error("Don't repeat the colors", { cause: 400 }))
        }
        if (product.colors.find(color => color.code == colorItem.code)) {
          return next(new Error(`this color code (${colorItem.code}) is already exist`, { cause: 400 }))
        }
        colorCodes.push(colorItem.code)
      }

      const color = product.colors.find(color => color._id == colorItem._id)



      let totalColorStock = 0
      if (colorItem.sizes?.length) {
        colorItem.sizes.forEach(async item => {
          const size = color.sizes.find(size => size._id == item._id)

          if (parseInt(size.stock) + parseInt(item.stock) < 0) {
            if (imageIds.length) {
              for (const id of imageIds) {
                await cloudinary.uploader.destroy(id);
              }
            }
            checkError = true
            return next(new Error(`there is no stock to remove in this size (${size.size}) which in this color (${color.name})`, { cause: 400 }))
          }
          totalStock += parseInt(item.stock)
          totalColorStock += parseInt(item.stock)
        })
      }

      if (checkError) {
        return 0
      }

      // Get main image for this color
      const mainImageFile = req.files.find(file => file.fieldname == `mainImage[${colors.indexOf(colorItem)}]`)

      let mainImage
      if (mainImageFile) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          mainImageFile.path,
          {
            folder: `${process.env.PROJECTNAME}/product/${product.cloudId}/${colorItem.name}/mainImage`,
          }
        );
        imageIds.push(public_id)
        mainImage = { secure_url, public_id }
        oldImageIds.push(color.mainImage.public_id)
      }

      // Get additional images for this color
      const colorImages = req.files.filter(file => file.fieldname == `images[${colors.indexOf(colorItem)}]`)

      const images = [];
      if (colorImages?.length) {
        for (const file of colorImages) {
          const { secure_url, public_id } = await cloudinary.uploader.upload(
            file.path,
            {
              folder: `${process.env.PROJECTNAME}/product/${product.cloudId}/${colorItem.name || color.name}/images`,
            }
          );
          imageIds.push(public_id)
          images.push({ secure_url, public_id });
        }
        for (const image of color.images) {
          oldImageIds.push(image.public_id)
        }
      }

      return {
        id: colorItem._id,
        ...(colorItem.name && { name: colorItem.name }),
        ...(colorItem.code && { code: colorItem.code }),
        sizes: colorItem.sizes?.length ? colorItem.sizes : [],
        stock: totalColorStock,
        ...(mainImage?.secure_url && { mainImage }),
        ...(images?.length && { images }),
      };
    }));

    await updateColorsWithSpecificSizes(processedColors)
  }


  if (price && discount) {
    req.body.finalPrice = Number.parseFloat(
      price - price * (discount / 100)
    ).toFixed(2);
  } else if (price) {
    req.body.finalPrice = Number.parseFloat(
      price - price * (product.discount / 100)
    ).toFixed(2);
  } else if (discount) {
    req.body.finalPrice = Number.parseFloat(
      product.price - product.price * (discount / 100)
    ).toFixed(2);
  }

  req.body.updatedBy = user._id

  // check ids
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

  delete req.body.colors

  const updateProduct = await findOneAndUpdate({
    model: productModel,
    condition: { _id: id },
    data: { ...req.body, $inc: { totalAmount: parseInt(totalStock), totalStock: parseInt(totalStock) } },
  });




  if (!updateProduct) {
    if (imageIds.length) {
      // if (replaceImages) {
      //   for (const image of req.body.images) {
      //     await cloudinary.uploader.destroy(image.public_id);
      //   }
      // } else {
      //   for (const id of imagesIdsUplaoded) {
      //     await cloudinary.uploader.destroy(id);
      //   }
      // }
      for (const id of imageIds) {
        await cloudinary.uploader.destroy(id);
      }
    }
    return next(new Error("Fail to update product", { cause: 400 }));
  }

  // if (imageId) {
  //   await cloudinary.uploader.destroy(imageId);
  // }


  if (oldImageIds.length) {
    for (const id of oldImageIds) {
      await cloudinary.uploader.destroy(id);
    }
  }
  return res.status(200).json({ message: "Done" });

})

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }

  const populate = [
    {
      path: "colors",
      select: "-createdAt -updatedAt",
    },
  ];

  const deleteProduct = await findByIdAndDelete({
    model: productModel,
    condition: { _id: id, createdBy: user._id },
    populate
  });

  if (!deleteProduct) {
    return next(new Error("In-valid product", { cause: 404 }));
  }


  const public_id = []

  for (const color of deleteProduct.colors) {

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
    condition: { _id: id },
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
    {
      path: "colors",
      select: "-createdAt -updatedAt",
    },
  ];

  let filter = { deleted: false, categoryDeleted: false, subcategoryDeleted: false, brandDeleted: false };
  if ((req.query.productSize || req.query.productSize?.length) && !req.query.colorCode) {
    filter.allSizes = { $in: req.query.productSize };
  }

  if (req.query.colorCode || req.query.colorCode?.length) {
    let colorIds

    if (req.query.productSize || req.query.productSize?.length) {
      let sizeFilter = {};

      if (Array.isArray(req.query.productSize)) {
        sizeFilter = { $in: req.query.productSize.map((item) => item.toLowerCase()) };
      } else if (req.query.productSize) {
        sizeFilter = req.query.productSize.toLowerCase();
      }
      colorIds = await colorModel.find({
        code: { $in: req.query.colorCode },
        'sizes': {
          $elemMatch: {
            size: sizeFilter
          }
        },
      }).select("_id");

    } else {
      colorIds = await find({ model: colorModel, condition: { code: { $in: req.query.colorCode } }, select: "_id" })
    }
    filter.colors = { $in: colorIds };
  }

  const apiFeature = new ApiFeatures(
    req.query,
    productModel.find(filter).populate(populate)
  )
    .filter()
    .paginate()
    .sort()
    .search()
    .select();
  const products = await apiFeature.mongooseQuery;
  const total = await countDocuments({
    model: productModel,
    condition: filter,
  });
  if (!total) {
    return next(new Error("In-valid products", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", products, total });
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


  let filter = { createdBy: user._id };
  if ((req.query.productSize || req.query.productSize?.length) && !req.query.colorCode) {
    filter.allSizes = { $in: req.query.productSize };
  }

  if (req.query.colorCode || req.query.colorCode?.length) {
    let colorIds

    if (req.query.productSize || req.query.productSize?.length) {
      let sizeFilter = {};

      if (Array.isArray(req.query.productSize)) {
        sizeFilter = { $in: req.query.productSize.map((item) => item.toLowerCase()) };
      } else if (req.query.productSize) {
        sizeFilter = req.query.productSize.toLowerCase();
      }
      colorIds = await colorModel.find({
        code: { $in: req.query.colorCode },
        'sizes': {
          $elemMatch: {
            size: sizeFilter
          }
        },
      }).select("_id");

    } else {
      colorIds = await find({ model: colorModel, condition: { code: { $in: req.query.colorCode } }, select: "_id" })
    }
    filter.colors = { $in: colorIds };
  }

  const apiFeature = new ApiFeatures(
    req.query,
    productModel.find(filter).populate(populate)
  )
    .filter()
    .paginate()
    .sort()
    .select()
    .search();
  const products = await apiFeature.mongooseQuery;
  const total = await countDocuments({
    model: productModel,
    condition: filter,
  });
  if (!total) {
    return next(new Error("In-valid products", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", products, total });
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
    {
      path: "colors",
      select: "-createdAt -updatedAt",
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
      {
        path: "colors",
        select: "-createdAt -updatedAt",
      },
    ];


    let filter = {
      deleted: false,
      categoryDeleted: false,
      subcategoryDeleted: false,
      brandDeleted: false,
      subcategoryId
    };
    if ((req.query.productSize || req.query.productSize?.length) && !req.query.colorCode) {
      filter.allSizes = { $in: req.query.productSize };
    }

    if (req.query.colorCode || req.query.colorCode?.length) {
      let colorIds

      if (req.query.productSize || req.query.productSize?.length) {
        let sizeFilter = {};

        if (Array.isArray(req.query.productSize)) {
          sizeFilter = { $in: req.query.productSize.map((item) => item.toLowerCase()) };
        } else if (req.query.productSize) {
          sizeFilter = req.query.productSize.toLowerCase();
        }
        colorIds = await colorModel.find({
          code: { $in: req.query.colorCode },
          'sizes': {
            $elemMatch: {
              size: sizeFilter
            }
          },
        }).select("_id");

      } else {
        colorIds = await find({ model: colorModel, condition: { code: { $in: req.query.colorCode } }, select: "_id" })
      }
      filter.colors = { $in: colorIds };
    }

    const apiFeature = new ApiFeatures(
      req.query,
      productModel.find(filter).populate(populate)
    )
      .filter()
      .paginate()
      .sort()
      .select()
      .search();



    const products = await apiFeature.mongooseQuery;
    const total = await countDocuments({
      model: productModel,
      condition: filter,
    });
    if (!total) {
      return next(new Error("In-valid products", { cause: 404 }));
    }
    return res.status(200).json({ message: "Done", products, total });
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
      {
        path: "colors",
        select: "-createdAt -updatedAt",
      },
    ];


    let filter = {
      deleted: false,
      categoryDeleted: false, subcategoryDeleted: false, brandDeleted: false,
      categoryId
    };
    if ((req.query.productSize || req.query.productSize?.length) && !req.query.colorCode) {
      filter.allSizes = { $in: req.query.productSize };
    }

    if (req.query.colorCode || req.query.colorCode?.length) {
      let colorIds

      if (req.query.productSize || req.query.productSize?.length) {
        let sizeFilter = {};

        if (Array.isArray(req.query.productSize)) {
          sizeFilter = { $in: req.query.productSize.map((item) => item.toLowerCase()) };
        } else if (req.query.productSize) {
          sizeFilter = req.query.productSize.toLowerCase();
        }
        colorIds = await colorModel.find({
          code: { $in: req.query.colorCode },
          'sizes': {
            $elemMatch: {
              size: sizeFilter
            }
          },
        }).select("_id");

      } else {
        colorIds = await find({ model: colorModel, condition: { code: { $in: req.query.colorCode } }, select: "_id" })
      }
      filter.colors = { $in: colorIds };
    }

    const apiFeature = new ApiFeatures(
      req.query,
      productModel.find(filter).populate(populate)
    )
      .filter()
      .paginate()
      .sort()
      .select()
      .search();
    const products = await apiFeature.mongooseQuery;
    const total = await countDocuments({
      model: productModel,
      condition: filter,
    });
    if (!total) {
      return next(new Error("In-valid products", { cause: 404 }));
    }
    return res.status(200).json({ message: "Done", products, total });
  }
);