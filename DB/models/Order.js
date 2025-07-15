import { Schema, Types, model } from "mongoose";

const orderSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    products: {
      type: [
        {
          name: {
            type: String,
            required: [true, "name of productId is required"],
          },
          productId: {
            type: Types.ObjectId,
            ref: "Product",
            required: [true, "Quantity is required"],
          },
          colorCode: {
            type: String,
            required: [true, "Color code is required"]
          },
          size: {
            type: String,
            enum: ["ss", "s", "m", "l", "xl", "xxl", "xxxl", ""],
            required: [true, "Color code is required"]
          },
          quantity: { type: Number, required: [true, "Quantity is required"] },
          unitePrice: {
            type: Number,
            default: 1,
          },
          finalPrice: {
            type: Number,
            default: 1,
          },
        },
      ],
      required: [true, "products are required"],
    },
    address: {
      type: {
        country: {
          type: String,
          required: [true, "country is required"]
        },
        governorate: {
          type: String,
          required: [true, "country is required"]
        },
        city: {
          type: String,
          required: [true, "country is required"]
        },
        street: {
          type: String
        },
        buildingNumber: {
          type: String
        },
      }, required: [true, "address is required"]
    },
    phone: { type: String, required: [true, "phone is required"] },
    subtotalPrice: {
      type: Number,
      default: 1,
    },
    couponId: {
      type: Types.ObjectId,
      ref: "Coupon",
    },
    finalPrice: {
      type: Number,
      default: 1,
    },
    note: String,
    status: {
      type: String,
      default: "placed",
      enum: [
        "placed",
        "received",
        "rejected",
        "cenceled",
        "onWay",
        "waitPayment",
      ],
    },
    reson: String,
    paymentMethod: {
      type: String,
      default: "cash",
      enum: ["cash", "card"],
    },
    isPaid: {
      type: Boolean, default: false
    },
    date: Date
  },
  {
    timestamps: true,
  }
);

const orderModel = model("Order", orderSchema);
export default orderModel;
