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
import couponModel from "../../../../DB/models/Coupon.js";

export const addtoCart = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { productId, quantity, size, colorCode, couponName } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }

  const populateCheckProduct = [
    {
      path: "colors",
      select: "-createdAt -updatedAt",
    },
  ];

  const checkProduct = await findOne({ model: productModel, condition: { _id: productId, deleted: false }, populate: populateCheckProduct });
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
    {
      path: "couponId",
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

  if (couponName) {
    const coupon = await findOne({
      model: couponModel,
      condition: { name: couponName.toLowerCase(), usedBy: { $nin: user._id } },
    });
    if (!coupon || coupon.expireDate.getTime() < Date.now()) {
      return next(new Error("In-valid or expired coupon", { cause: 404 }));
    }
    req.body.coupon = coupon;
  }



  if (!findCart) {
    const cart = await create({
      model: cartModel,
      data: { userId: user._id, products: [] },
    });
    const product = await create({
      model: productCartModel,
      data: {
        cartId: cart._id,
        productId,
        quantity,
        finalPrice: finalProductPrice,
        totalPrice: totalProductPrice,
        discount: (totalProductPrice - finalProductPrice).toFixed(2),
        colorName: checkColor.name,
        colorCode,
        size
      },
    });
    cart.products = [product._id]
    cart.finalPrice = finalProductPrice
    cart.totalPrice = totalProductPrice
    cart.discount = (totalProductPrice - finalProductPrice).toFixed(2)
    if (req.body.coupon) {
      cart.priceAfterCoupon = Number.parseFloat(finalProductPrice - finalProductPrice * ((req.body.coupon.amount) / 100)).toFixed(2)
      cart.couponId = req.body.coupon._id
    } else {
      cart.priceAfterCoupon = finalProductPrice
    }

    await cart.save()
    const getCart = await findById({ model: cartModel, condition: cart._id, populate: populateCart })
    return res.status(201).json({ message: "Done", cart: getCart });
  }


  if (!req.body.coupon && findCart.couponId) {
    req.body.coupon = findCart.couponId
  }


  let finalPrice = +findCart.finalPrice || 0
  let totalPrice = +findCart.totalPrice || 0



  if (findCart.products?.length) {
    for (let i = 0; i < findCart.products.length; i++) {
      if (
        findCart.products[i].productId.toString() == productId &&
        findCart.products[i].colorCode == colorCode.toLowerCase() &&
        findCart.products[i].size == size.toLowerCase()
        // && findCart.products.find(item => item.colorCode == colorCode.toLowerCase())
        // && findCart.products.find(item => item.size == size.toLowerCase())
      ) {

        // finalPrice = finalPrice - findCart.products.find(item => item.colorCode == colorCode.toLowerCase()).finalPrice;
        totalPrice = totalPrice - findCart.products.find(
          item => item.colorCode == colorCode.toLowerCase() &&
            item.productId.toString() == productId &&
            item.size == size.toLowerCase()).totalPrice;

        finalPrice = finalPrice - findCart.products.find(
          item => item.colorCode == colorCode.toLowerCase() &&
            item.productId.toString() == productId &&
            item.size == size.toLowerCase()).finalPrice;

        await updateOne({
          model: productCartModel,
          condition: {
            productId,
            cartId: findCart._id,
            colorCode: colorCode.toLowerCase(),
            size: size.toLowerCase()
          }, data: {
            quantity,
            finalPrice: finalProductPrice,
            discount: (totalProductPrice - finalProductPrice).toFixed(2),
            totalPrice: totalProductPrice
          }
        })

        finalPrice += +finalProductPrice
        totalPrice += +totalProductPrice
        let priceAfterCoupon
        if (req.body.coupon) {
          priceAfterCoupon = Number.parseFloat(finalPrice - finalPrice * ((req.body.coupon.amount) / 100)).toFixed(2)
        } else {
          priceAfterCoupon = finalPrice
        }


        findCart = await findOneAndUpdate({
          model: cartModel,
          condition: {
            _id: findCart._id
          },
          data: {
            ...(req.body.coupon?._id && { couponId: req.body.coupon._id }),
            priceAfterCoupon,
            totalPrice,
            finalPrice,
            discount: (totalPrice - finalPrice).toFixed(2)
          },
          option: {
            new: true
          },
          populate: populateCart
        })
        break;
      }
    }
  } else {
    const newProduct = await create({
      model: productCartModel,
      data: {
        productId,
        quantity,
        cartId: findCart._id,
        colorCode,
        size,
        finalPrice: finalProductPrice,
        discount: (totalProductPrice - finalProductPrice),
        totalPrice: totalProductPrice,
        colorName: checkColor.name
      }
    })

    finalPrice += +finalProductPrice
    totalPrice += +totalProductPrice
    let priceAfterCoupon
    if (req.body.coupon) {
      priceAfterCoupon = Number.parseFloat(finalPrice - finalPrice * ((req.body.coupon.amount) / 100)).toFixed(2)
    } else {
      priceAfterCoupon = finalPrice
    }
    findCart = await findOneAndUpdate({
      model: cartModel,
      condition: {
        _id: findCart._id
      },
      data: {
        ...(req.body.coupon?._id && { couponId: req.body.coupon._id }),
        priceAfterCoupon,
        $addToSet: { products: newProduct._id },
        totalPrice,
        finalPrice,
        discount: (totalPrice - finalPrice).toFixed(2)
      },
      option: { new: true },
      populate: populateCart
    })
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
    {
      path: "couponId",
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
  if (!cart.products?.length) {
    return next(new Error("There is no product in cart", { cause: 400 }));

  }
  let finalPrice = 0;
  let totalPrice = 0;
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

  const checkProduct = cart.products.find(product => product.productId.toString() == productId)
  if (!(checkProduct.productId.toString() == productId
    && checkProduct.colorCode.toString() == colorCode.toLowerCase() &&
    checkProduct.size.toString() == size.toLowerCase())) {
    return next(
      new Error("In-valid this product with this color and this size in your cart", { cause: 400 })
    );
  }
  // console.log(checkProduct);

  if (cart.products?.length == 1 && checkProduct) {
    await findOneAndDelete({ model: productCartModel, condition: { productId, cartId: cart._id, colorCode: colorCode.toLowerCase(), size: size.toLowerCase() } })
    cart = await findOneAndUpdate({
      model: cartModel,
      condition: { _id: cart._id },
      data: {
        products: [],
        priceAfterCoupon: 0,
        finalPrice,
        totalPrice,
        discount: 0
      },
      option: { new: true },
      populate: populateCart
    })
  } else {
    for (let i = 0; i < cart.products.length; i++) {
      // console.log(cart.products[i].colorCode.toString());

      // console.log(cart.products[i].productId.toString() == productId &&
      //   cart.products[i].colorCode.toString() == colorCode.toLowerCase());

      if (
        cart.products[i].productId.toString() == productId
        && cart.products[i].colorCode.toString() == colorCode.toLowerCase() && cart.products[i].size.toString() == size.toLowerCase()) {
        console.log("dddddd");

        const deleteProduct = await findOneAndDelete({ model: productCartModel, condition: { productId, cartId: cart._id, colorCode: colorCode.toLowerCase(), size: size.toLowerCase() } })
        finalPrice = +cart.finalPrice - +deleteProduct.finalPrice
        totalPrice = +cart.totalPrice - +deleteProduct.totalPrice
        let priceAfterCoupon
        if (cart.couponId) {
          priceAfterCoupon = Number.parseFloat(finalPrice - finalPrice * ((cart.couponId.amount) / 100)).toFixed(2)
        } else {
          priceAfterCoupon = finalPrice
        }
        cart = await findOneAndUpdate({
          model: cartModel,
          condition: { _id: cart._id },
          data: {
            $pull: { products: deleteProduct._id },
            priceAfterCoupon,
            finalPrice: finalPrice.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
            discount: (totalPrice - finalPrice).toFixed(2)
          },
          option: { new: true },
          populate: populateCart
        })
        break;
      }
    }
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
      cart.priceAfterCoupon = 0,
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
      path: "couponId",
      select: "amount expireDate name",
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
