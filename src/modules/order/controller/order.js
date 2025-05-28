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
        select: "productId quantity -_id",
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
  const productsIds = [];
  for (let product of req.body.products) {
    const checkProduct = await findOne({
      model: productModel,
      condition: {
        _id: product.productId,
        stock: { $gte: product.quantity },
      },
    });
    if (!checkProduct) {
      return next(
        new Error("In-valid product to place this order", { cause: 400 })
      );
    }
    if (productsIds.includes(checkProduct._id.toString())) {
      return next(new Error("Dupplicate product", { cause: 409 }));
    }
    productsIds.push(checkProduct._id.toString());
    if (req.body.isCart) {
      product = product.toObject();
    }
    product.name = checkProduct.name;
    product.unitePrice = checkProduct.finalPrice;
    product.finalPrice = product.quantity * checkProduct.finalPrice.toFixed(2);
    subtotalPrice += product.finalPrice;
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
  const options = req.body.products.map(product => {
    return ({
      updateOne: {
        "filter": {
          _id: product.productId
        },
        "update": {
          $inc: {
            soldItems: parseInt(product.quantity),
            stock: -parseInt(product.quantity),
          }
        }
      }
    })
  })
  await productModel.bulkWrite(options)

  // for (const product of req.body.products) {
  //   await findByIdAndUpdate({
  //     model: productModel,
  //     condition: product.productId,
  //     data: {
  //       $inc: {
  //         soldItems: parseInt(product.quantity),
  //         stock: -parseInt(product.quantity),
  //       },
  //     },
  //   });
  // }
  if (req.body.isCart) {
    const cart = await findOneAndUpdate({ model: cartModel, condition: { userId: user._id }, data: { products: [], finalPrice: 0 } })
    await deleteMany({ model: productCartModel, condition: { cartId: cart._id } })
  } else {
    for (const productId of productsIds) {
      const cart = await updateOne({ model: cartModel, condition: { userId: user._id }, data: { $pull: { products: productId } } })
      await findOneAndDelete({ model: productCartModel, condition: { productId, cartId: cart._id } })
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
      metadata: { orderId: order._id.toString() },
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
  const order = await findOne({
    model: orderModel,
    condition: { _id: id, userId: user._id },
  });
  if (!order) {
    return next(new Error("In-valid order", { cause: 404 }));
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
  for (const product of order.products) {
    await updateOne({
      model: productModel,
      condition: { _id: product.productId },
      data: {
        $inc: {
          soldItems: -parseInt(product.quantity),
          stock: parseInt(product.quantity),
        },
      },
    });
  }
  if (order.couponId) {
    await updateOne({
      model: couponModel,
      condition: { usedBy: user._id },
      data: { $pull: { usedBy: user._id } },
    });
  }
  const finalOrder = await order.save();
  return res.status(200).json({ message: "Done", order: finalOrder });
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

// export const webhook = asyncHandler(async (req, res, next) => {
//   const sig = req.headers["stripe-signature"];
//   const stripe = new Stripe(process.env.STRIPE_KEY);
//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.endpointSecret
//     );
//   } catch (err) {
//     return next(new Error(`Webhook Error: ${err.message}`, { cause: 400 }));
//   }
//   // Handle the event
//   const { orderId } = event.data.object.metadata;
//   if (event.type != "checkout.session.completed") {
//     const order = await findByIdAndUpdate({
//       model: orderModel,
//       condition: orderId,
//       data: { status: "rejected" },
//     });
//     for (const product of order.products) {
//       await updateOne({
//         model: productModel,
//         condition: { _id: product.productId },
//         data: {
//           $inc: {
//             soldItems: -parseInt(product.quantity),
//             stock: parseInt(product.quantity),
//           },
//         },
//       });
//     }
//     if (order.couponId) {
//       await updateOne({
//         model: couponModel,
//         condition: { _id: order.couponId },
//         data: { $pull: { usedBy: user._id } },
//       });
//     }
//     return next(new Error("Rejected order", { cause: 400 }));
//   }
//   await updateOne({
//     model: orderModel,
//     condition: { _id: orderId },
//     data: { status: "placed" },
//   });
//   return res.status(200).json({ message: "Done" });
// });

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