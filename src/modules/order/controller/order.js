import { asyncHandler } from "../../../utils/errorHandling.js";
// import { createInvoice } from "../../../utils/pdf.js";
import {
  create,
  deleteMany,
  findByIdAndUpdate,
  findOne,
  findOneAndDelete,
  findOneAndUpdate,
  updateOne,
} from "../../../../DB/DBMethods.js";
// import { fileURLToPath } from "url";
// import path from "path";
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
import productModel from "../../../../DB/models/Product.js";
import couponModel from "../../../../DB/models/Coupon.js";
import orderModel from "../../../../DB/models/Order.js";
import cartModel from "../../../../DB/models/Cart.js";
import ApiFeatures from "../../../utils/apiFeatures.js";
// import sendEmail from "../../../utils/sendEmail.js";
import Stripe from "stripe";
import payment from "../../../utils/payment.js";
import productCartModel from "../../../../DB/models/ProductsOfCart.js";
import colorModel from "../../../../DB/models/Colors.js";
import { populate } from "dotenv";
// import { createInvoice } from "../../../utils/pdf.js";
export const addOrder = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { paymentMethod, couponName } = req.body;
  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }
  if (!req.body.products) {
    const populate = [
      {
        path: "products",
        select: "productId colorCode size quantity -_id",
      },
    ]
    const cart = await findOne({
      model: cartModel,
      condition: { userId: user._id },
      populate
    });

    if (!cart?.products.length) {
      return next(new Error("Your cart is empty", { cause: 400 }));
    }

    req.body.isCart = true;
    req.body.products = cart.products;
  }
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
  let subtotalPrice = 0;
  const finalProducts = [];
  const productsList = [];
  const colorsList = [];
  for (let product of req.body.products) {

    const exists = productsList.some(
      (item) => item.id == product.productId &&
        item.colorCode == product.colorCode.toLowerCase() &&
        item.size == product.size.toLowerCase()
    );
    if (exists) {
      return next(new Error("Dupplicate product with the same color and size", { cause: 409 }));
    }

    const populate = [
      {
        path: "colors",
        select: "-createdAt -updatedAt",
      },
    ];

    const checkProduct = await findOne({
      model: productModel,
      condition: {
        _id: product.productId,
        deleted:false,
        totalStock: { $gte: product.quantity },
      },
      populate
    });

    if (!checkProduct) {
      return next(
        new Error("In-valid product to place this order", { cause: 400 })
      );
    }

    const checkColor = checkProduct.colors.find((color) => color.code == product.colorCode.toLowerCase() && color.stock >= product.quantity)

    if (!checkColor) {
      return next(new Error(`${checkProduct.name} doesn't have that color code ${product.colorCode} or there is no stock to place this quantity in this color`, { cause: 404 }))
    }

    const checkSize = checkColor.sizes.find(item => item.size == product.size.toLowerCase() && item.stock >= product.quantity)

    if (!checkSize) {
      return next(new Error(`${checkProduct.name} doesn't have that size ${product.size} with this color code ${product.colorCode} or there is no stock to place this quantity in this size with this color`, { cause: 404 }))
    }

    productsList.push({ id: checkProduct._id, colorCode: product.colorCode, size: product.size });

    colorsList.push({ colorCode: product.colorCode, size: product.size, color: checkColor, quantity: product.quantity })

    if (req.body.isCart) {
      product = product.toObject();
    }

    product.name = checkProduct.name;
    product.unitePrice = checkProduct.finalPrice;
    product.finalPrice = (product.quantity * checkProduct.finalPrice).toFixed(2);
    subtotalPrice += +product.finalPrice;
    finalProducts.push(product);
  }
  req.body.products = finalProducts;
  req.body.subtotalPrice = subtotalPrice;
  couponName && (req.body.couponId = req.body.coupon?._id);
  req.body.finalPrice =
    subtotalPrice - subtotalPrice * ((req.body.coupon?.amount || 0) / 100);
  req.body.userId = user._id;
  req.body.status = paymentMethod == "card" ? "waitPayment" : "placed";
  req.body.date = new Date()

  const order = await create({ model: orderModel, data: req.body });
  if (!order) {
    return next(new Error("Fail to add order", { cause: 400 }));
  }


  const productOptions = req.body.products.map(product => {
    return ({
      updateOne: {
        "filter": {
          _id: product.productId
        },
        "update": {
          $inc: {
            soldItems: parseInt(product.quantity),
            totalStock: -parseInt(product.quantity),
          }
        }
      }
    })
  })
  await productModel.bulkWrite(productOptions)

  const colorOptions = colorsList.map(item => {
    return ({
      updateOne: {
        "filter": {
          _id: item.color._id
        },
        "update": {
          $inc: {
            soldItems: parseInt(item.quantity),
            stock: -parseInt(item.quantity),
            "sizes.$[sizeItem].soldItems": parseInt(item.quantity),
            "sizes.$[sizeItem].stock": -parseInt(item.quantity)
          }
        },
        arrayFilters: [
          { "sizeItem.size": item.size }
        ]
      }
    })
  })
  await colorModel.bulkWrite(colorOptions)

  if (req.body.isCart) {
    const cart = await findOneAndUpdate({ model: cartModel, condition: { userId: user._id }, data: { products: [], finalPrice: 0, discount: 0, totalPrice: 0 } })
    await deleteMany({ model: productCartModel, condition: { cartId: cart._id } })
  } else {
    const cart = await findOne({
      model: cartModel,
      condition: { userId: user._id },
    });

    if (cart) {
      for (const product of req.body.products) {
        const productCart = await findOneAndDelete({ model: productCartModel, condition: { productId: product.productId, cartId: cart._id, colorCode: product.colorCode, size: product.size } })
        if (productCart) {
          cart.products.pull(productCart._id)
        }
        // const cart = await updateOne({ model: cartModel, condition: { userId: user._id }, data: { $pull: { products: product.productId } } })
      }
      await cart.save()
    }
  }
  if (req.body.coupon) {
    await findByIdAndUpdate({
      model: couponModel,
      condition: req.body.coupon._id,
      data: { $push: { usedBy: user._id } },
    });
  }

  // const invoice = {
  //   shipping: {
  //     name: user.userName,
  //     address: order.address,
  //     city: "Cairo",
  //     state: "aul makram streat",
  //     country: "Egypt",
  //   },
  //   items: order.products,
  //   subtotal: subtotalPrice,
  //   total: order.finalPrice,
  //   date: order.createdAt,
  //   invoice_nr: order.phone,
  // };
  // await createInvoice(invoice, path.join(__dirname, "../../../../invoice.pdf"));
  // await sendEmail({
  //   to: user.email,
  //   subject: "invoice",
  //   attachments: [
  //     {
  //       path: "invoice.pdf",
  //       contentType: "application/pdf",
  //     },
  //   ],
  // });

  if (order.paymentMethod == "card") {
    const stripe = new Stripe(process.env.STRIPE_KEY);
    if (req.body.coupon) {
      const coupon = await stripe.coupons.create({
        percent_off: req.body.coupon.amount,
        duration: "once",
      });
      req.body.couponId = coupon.id;
    }
    const session = await payment({
      stripe,
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user.email,
      cancel_url: process.env.CENCEL_URL,
      success_url: process.env.SUCCESS_URL,
      metadata: { orderId: order._id },
      discounts: req.body.couponId ? [{ coupon: req.body.couponId }] : [],
      line_items: order.products.map((product) => {
        return {
          price_data: {
            currency: "egp",
            product_data: {
              name: product.name,
            },
            unit_amount: product.unitePrice * 100,
          },
          quantity: product.quantity,
        };
      }),
    });
    return res.status(201).json({ message: "Done", url: session.url });
  }
  return res.status(201).json({ message: "Done" });
});

export const cencelOrder = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }


  const populate = [
    {
      path: "products.productId",
      select: "_id color",
      populate: {
        path: "colors",
        select: "name code sizes stock mainImage images",
      }
    },
  ];

  const order = await findOne({
    model: orderModel,
    condition: { _id: id, userId: user._id },
    populate
  });

  if (!order) {
    return next(new Error("In-valid order", { cause: 404 }));
  }

  // return res.status(200).json({ message: "Done", order })


  if (order.status == "cenceled") {
    return next(
      new Error(
        `This order has beed cenceled`,
        { cause: 400 }
      )
    );
  }

  if (
    (order.status != "placed" && order.paymentMethod == "cash") ||
    (order.status != "waitPayment" && order.paymentMethod == "card")
  ) {
    return next(
      new Error(
        `You can't cencel your order after it's been changed to ${order.status} and payment method is ${order.paymentMethod}`,
        { cause: 400 }
      )
    );
  }
  order.status = "cenceled";


  const productOptions = order.products.map(product => {
    return ({
      updateOne: {
        "filter": {
          _id: product.productId._id
        },
        "update": {
          $inc: {
            soldItems: -parseInt(product.quantity),
            totalStock: parseInt(product.quantity),
          }
        }
      }
    })
  })
  await productModel.bulkWrite(productOptions)

  const colors = []

  for (const product of order.products) {
    const color = product.productId.colors.find(color => color.code == product.colorCode)
    if (color) {
      colors.push({ id: color._id, quantity: product.quantity, size: product.size })
    }

    // await updateOne({
    //   model: productModel,
    //   condition: { _id: product.productId },
    //   data: {
    //     $inc: {
    //       soldItems: -parseInt(product.quantity),
    //       stock: parseInt(product.quantity),
    //     },
    //   },
    // });
  }


  const colorOptions = colors.map(item => {
    return ({
      updateOne: {
        "filter": {
          _id: item.id
        },
        "update": {
          $inc: {
            soldItems: -parseInt(item.quantity),
            stock: parseInt(item.quantity),
            "sizes.$[sizeItem].soldItems": -parseInt(item.quantity),
            "sizes.$[sizeItem].stock": parseInt(item.quantity)
          }
        },
        arrayFilters: [
          { "sizeItem.size": item.size }
        ]
      }
    })
  })
  await colorModel.bulkWrite(colorOptions)


  if (order.couponId) {
    await updateOne({
      model: couponModel,
      condition: { _id: order.couponId },
      data: { $pull: { usedBy: user._id } },
    });
  }

  const finalOrder = await order.save();

  return res.status(200).json({ message: "Done", order: finalOrder });

});
export const updateStatus = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  const { status } = req.body;

  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }


  const populate = [
    {
      path: "userId",
      select: "userName email image",
    },
    {
      path: "products.productId",
    },
    // {
    //   path: "couponId",
    //   select: "name amount",
    // },
  ];

  let finalStatus

  switch (status) {
    case 1:
      finalStatus = "placed"
      break;
    case 2:
      finalStatus = "onWay"
      break;
    case 3:
      finalStatus = "received"
      break;
    case 4:
      finalStatus = "rejected"
      break;

    default:
      return next(new Error("You have to make the status between 1 and 4 ", { cause: 400 }))
      break;
  }

  const order = await findOneAndUpdate({
    model: orderModel,
    condition: { _id: id, userId: user._id },
    data: { status: finalStatus },
    populate,
    option: { new: true }
  });

  if (!order) {
    return next(new Error("In-valid order", { cause: 404 }));
  }


  return res.status(200).json({ message: "Done", order });

});
export const userOrders = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const populate = [
    {
      path: "userId",
      select: "userName email image",
    },
    {
      path: "products.productId",
    },
    // {
    //   path: "couponId",
    //   select: "name amount",
    // },
  ];
  const apiFeature = new ApiFeatures(
    req.query,
    orderModel.find({ userId: user._id }).populate(populate)
  )
    .filter()
    .paginate()
    .search()
    .select()
    .sort();
  const orders = await apiFeature.mongooseQuery;
  if (!orders.length) {
    return next(new Error("In-valid orders", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", orders });
});
export const webhook = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const stripe = new Stripe(process.env.STRIPE_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.endpointSecret
    );
  } catch (err) {
    return next(new Error(`Webhook Error: ${err.message}`, { cause: 400 }));
  }
  // Handle the event
  const { orderId } = event.data.object.metadata;

  if (event.type != "checkout.session.completed") {
    const order = await findByIdAndUpdate({
      model: orderModel,
      condition: orderId,
      data: { status: "rejected" },
    });

    const options = order.products.map(product => {
      return ({
        updateOne: {
          "filter": {
            _id: product.productId
          },
          "update": {
            $inc: {
              soldItems: -parseInt(product.quantity),
              stock: parseInt(product.quantity),
            }
          }
        }
      })
    })
    await productModel.bulkWrite(options)
    if (order.couponId) {
      await updateOne({
        model: couponModel,
        condition: { _id: order.couponId },
        data: { $pull: { usedBy: user._id } },
      });
    }
    return next(new Error("Rejected order", { cause: 400 }));
  }
  await updateOne({
    model: orderModel,
    condition: { _id: orderId },
    data: { status: "placed" },
  });
  return res.status(200).json({ message: "Done" });
});