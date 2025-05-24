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
  const { productId, quantity } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }
  const checkProduct = await findById({ model: productModel, condition: productId });
  if (!checkProduct) {
    return next(new Error("In-valid this product", { cause: 404 }));
  }
  if (checkProduct.deleted) {
    return next(new Error("This product is not available", { cause: 400 }));
  }
  if (checkProduct.stock < quantity) {
    await updateOne({
      model: productModel,
      condition: { _id: productId },
      data: { $addToSet: { wishUserList: user._id } },
    });
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
  const finalProductPrice = (checkProduct.finalPrice * quantity);

  if (!findCart) {
    const cart = await create({
      model: cartModel,
      data: { userId: user._id, products: [] },
    });
    const product = await create({
      model: productCartModel,
      data: { cartId: cart._id, productId, quantity, finalPrice: finalProductPrice },
    });
    cart.products = [product._id]
    cart.finalPrice = finalProductPrice
    await cart.save()
    return res.status(201).json({ message: "Done", numberOfProducts: cart.products.length, finalPrice: finalProductPrice });
  }

  let finalPrice = findCart.finalPrice
  let match = false;
  for (let i = 0; i < findCart.products.length; i++) {
    if (findCart.products[i].productId.toString() == productId) {
      finalPrice = finalPrice - findCart.products[i].finalPrice;
      await updateOne({ model: productCartModel, condition: { productId, cartId: findCart._id }, data: { quantity, finalPrice: finalProductPrice } })
      finalPrice = finalPrice + finalProductPrice
      findCart.finalPrice = finalPrice.toFixed(2)
      await findCart.save()
      match = true;
      break;
    }
  }
  // push new product into cart
  if (!match) {
    const newProduct = await create({ model: productCartModel, data: { productId, quantity, cartId: findCart._id, finalPrice: finalProductPrice } })
    finalPrice = finalPrice + finalProductPrice
    findCart = await findOneAndUpdate({ model: cartModel, condition: { _id: findCart._id }, data: { $addToSet: { products: newProduct._id }, finalPrice: finalPrice.toFixed(2) }, option: { new: true } })
  }
  return res.status(200).json({ message: "Done", numberOfProducts: findCart.products.length, finalPrice });
});
export const deleteFromCart = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { productId, cartId } = req.params;
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
  let match = false;
  for (let i = 0; i < cart.products.length; i++) {
    if (cart.products[i].productId.toString() == productId) {
      const deleteProduct = await findOneAndDelete({ model: productCartModel, condition: { productId, cartId: cart._id } })
      finalPrice = cart.finalPrice - deleteProduct.finalPrice
      cart = await findOneAndUpdate({
        model: cartModel, condition: { _id: cart._id }, data: { $pull: { products: deleteProduct._id }, finalPrice: finalPrice.toFixed(2) },
        option: { new: true }
      })
      match = true;
      break;
    }
  }
  if (match == false) {
    return next(
      new Error("In-valid this product in your cart", { cause: 400 })
    );
  }
  return res.status(200).json({ message: "Done", numberOfProducts: cart.products.length, finalPrice });
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
    return next(new Error("In-valid cart", { cause: 404 }));
  }
  if (cart.products.length) {
    cart.products = [];
    cart.finalPrice = 0,
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
      select: "productId quantity -_id",
      populate: {
        path: "productId",
      }
    },
  ];
  const cart = await findOne({
    model: cartModel,
    condition: { userId: user._id },
    populate,
  });
  if (!cart) {
    return next(new Error("In-valid cart", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", cart });
});
