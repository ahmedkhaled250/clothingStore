import { Schema, Types, model } from "mongoose";

const reviewSchema = new Schema(
  {
    message: { type: String, required: [true, "message is required"] },
    rating: {
      type: Number,
      required: true,
      min: [1, "minimum rating 1"],
      max: [5, "maximum rating 5"],
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    productId: {
      type: Types.ObjectId,
      ref: "Product",
      required: [true, "ProductId is required"],
    },
    orderId: {
      type: Types.ObjectId,
      ref: "Order",
      required: [true, "OrderId is required"],
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const reviewModel = model("Review", reviewSchema);
export default reviewModel;
