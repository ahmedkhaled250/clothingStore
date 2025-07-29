import { asyncHandler } from "../../../utils/errorHandling.js";
import {
  create,
  deleteMany,
  findById,
  findByIdAndDelete,
  findOne,
  findOneAndDelete,
  findOneAndUpdate,
  updateOne,
} from "../../../../DB/DBMethods.js";
import cartModel from "../../../../DB/models/Cart.js";
import productModel from "../../../../DB/models/Product.js";
import productCartModel from "../../../../DB/models/ProductsOfCart.js";

export const addtoCart = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { productId, quantity, size, colorCode } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }

  const populateCheckProduct = [
    {
      path: "colors",
      select: "-createdAt -updatedAt",
    },
  ];

  const checkProduct = await findOne({ model: productModel, condition: { _id: productId }, populate: populateCheckProduct });
  if (!checkProduct) {
    return next(new Error("In-valid this product", { cause: 404 }));
  }
  if (checkProduct.deleted || checkProduct.categoryDeleted || checkProduct.subcategoryDeleted || checkProduct.brandDeleted) {
    return next(new Error("This product is not available", { cause: 400 }));
  }

  const checkColor = checkProduct.colors.find((color) => color.code == colorCode.toLowerCase())

  if (!checkColor) {
    return next(new Error("THis product doesn't have that color code", { cause: 404 }))
  }

  const checkSize = checkColor.sizes.find(item => item.size == size)

  if (!checkSize) {
    return next(new Error("THis product doesn't have that size in that color", { cause: 404 }))
  }

  if (checkSize.stock < quantity) {
    if (!checkProduct.wishUserList.find(item => item.userId == user._id)) {
      await updateOne({
        model: productModel,
        condition: { _id: productId },
        data: { $push: { wishUserList: { userId: user._id, colorCode } } },
      });
    }

    return next(new Error("This quantity is not available", { cause: 400 }));
  }

  const populate = [
    {
      path: "products",
    },
  ]

  let findCart = await findOne({
    model: cartModel,
    condition: { userId: user._id },
    populate
  });


  const populateCart = [
    {
      path: "userId",
      select: "userName email image",
    },
    {
      path: "products",
      select: "productId quantity colorCode size finalPrice discount totalPrice colorName -_id",
      populate: {
        path: "productId",
        populate: {
          path: "colors",
          select: "-createdAt"
        }
      }
    },
  ];

  const finalProductPrice = (checkProduct.finalPrice * quantity).toFixed(2);
  const totalProductPrice = (checkProduct.price * quantity).toFixed(2);

  if (!findCart) {
    const cart = await create({
      model: cartModel,
      data: { userId: user._id, products: [] },
    });
    const product = await create({
      model: productCartModel,
      data: { cartId: cart._id, productId, quantity, finalPrice: finalProductPrice, totalPrice: totalProductPrice, discount: (totalProductPrice - finalProductPrice), colorName: checkColor.name, colorCode, size },
    });
    cart.products = [product._id]
    cart.finalPrice = finalProductPrice
    cart.totalPrice = totalProductPrice
    cart.discount = (totalProductPrice - finalProductPrice)
    await cart.save()
    const getCart = await findById({ model: cartModel, condition: cart._id, populate: populateCart })
    return res.status(201).json({ message: "Done", cart: getCart });
  }

  let finalPrice = +findCart.finalPrice?.toFixed(2) || 0
  let totalPrice = +findCart.totalPrice?.toFixed(2) || 0


  let match = false;

  for (let i = 0; i < findCart.products.length; i++) {
    if (findCart.products[i].productId.toString() == productId && findCart.products.find(item => item.colorCode == colorCode.toLowerCase()) && findCart.products.find(item => item.size == size.toLowerCase())) {

      finalPrice = finalPrice - findCart.products[i].finalPrice;
      totalPrice = totalPrice - findCart.products[i].totalPrice;

      await updateOne({ model: productCartModel, condition: { productId, cartId: findCart._id }, data: { quantity, finalPrice: finalProductPrice, totalPrice: totalProductPrice } })

      finalPrice = finalPrice + +finalProductPrice
      totalPrice = totalPrice + +totalProductPrice

      findCart = await findOneAndUpdate({ model: cartModel, condition: { _id: findCart._id }, data: { totalPrice, finalPrice, discount: (totalPrice - finalPrice) }, option: { new: true }, populate: populateCart })
      match = true;
      break;
    }
  }
  // push new product into cart
  if (!match) {
    const newProduct = await create({ model: productCartModel, data: { productId, quantity, cartId: findCart._id, colorCode, size, finalPrice: finalProductPrice, discount: (totalProductPrice - finalProductPrice), totalPrice: totalProductPrice, colorName: checkColor.name } })
    console.log({ newProduct });

    finalPrice = +finalPrice + +finalProductPrice
    totalPrice = +totalPrice + +totalProductPrice
    findCart = await findOneAndUpdate({ model: cartModel, condition: { _id: findCart._id }, data: { $addToSet: { products: newProduct._id }, totalPrice, finalPrice, discount: (totalPrice - finalPrice) }, option: { new: true }, populate: populateCart })
  }

  return res.status(200).json({ message: "Done", cart: findCart });
});

export const deleteFromCart = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { productId, cartId } = req.params;
  const { colorCode, size } = req.body;

  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }
  const populate = [
    {
      path: "products",
    },
  ]
  let cart = await findOne({
    model: cartModel,
    condition: { userId: user._id, _id: cartId },
    populate
  });
  if (!cart) {
    return next(new Error("You didn't add any product to your cart before", { cause: 404 }));
  }
  let finalPrice;
  let totalPrice;
  let match = false;
  const populateCart = [
    {
      path: "userId",
      select: "userName email image",
    },
    {
      path: "products",
      select: "productId quantity colorCode size finalPrice discount totalPrice colorName -_id",
      populate: {
        path: "productId",
        populate: {
          path: "colors",
          select: "-createdAt"
        }
      }
    },
  ];
  for (let i = 0; i < cart.products.length; i++) {


    if (cart.products[i].productId.toString() == productId && cart.products[i].colorCode.toString() == colorCode.toLowerCase() && cart.products[i].size.toString() == size.toLowerCase()) {
      const deleteProduct = await findOneAndDelete({ model: productCartModel, condition: { productId, cartId: cart._id, colorCode: colorCode.toLowerCase(), size: size.toLowerCase() } })
      finalPrice = +cart.finalPrice - +deleteProduct.finalPrice
      totalPrice = +cart.totalPrice - +deleteProduct.totalPrice
      cart = await findOneAndUpdate({
        model: cartModel, condition: { _id: cart._id }, data: { $pull: { products: deleteProduct._id }, finalPrice: finalPrice.toFixed(2), totalPrice: totalPrice.toFixed(2), discount: (finalPrice.toFixed(2) - totalPrice.toFixed(2)) },
        option: { new: true },
        populate: populateCart
      })
      match = true;
      break;
    }
  }
  if (match == false) {
    return next(
      new Error("In-valid this product with this color and this size in your cart", { cause: 400 })
    );
  }
  return res.status(200).json({ message: "Done", cart });
});

export const removeProductsFromCart = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;

  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }

  const cart = await findOne({
    model: cartModel,
    condition: { userId: user._id, _id: id },
  });

  if (!cart) {
    return next(new Error("Your cart is empty", { cause: 404 }));
  }

  if (cart.products.length) {
    cart.products = [];
    cart.finalPrice = 0,
      cart.discount = 0,
      cart.totalPrice = 0,
      await cart.save();
    await deleteMany({ model: productCartModel, condition: { cartId: cart._id } })
    return res.status(200).json({ message: "Done" });
  } else {
    return next(
      new Error("Already,You havn't any product in your cart", { cause: 400 })
    );
  }
});

export const getMyCart = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const populate = [
    {
      path: "userId",
      select: "userName email image",
    },
    {
      path: "products",
      select: "productId quantity colorCode size finalPrice discount totalPrice colorName -_id",
      populate: {
        path: "productId",
        populate: {
          path: "colors",
          select: "-createdAt"
        }
      }
    },
  ];
  const cart = await findOne({
    model: cartModel,
    condition: { userId: user._id },
    populate,
  });
  if (!cart) {
    return next(new Error("Your cart is empty", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", cart });
});
