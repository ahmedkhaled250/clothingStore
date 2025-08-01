import { Schema, Types, model } from "mongoose";

const colorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Color name is required"],
      min: [2, "minimum length 2 char"],
      max: [20, "max length 2 char"],
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Code name is required"],
      lowercase: true,
    },
    sizes: {
      type: [{  
        size: {
          type: String,
          enum: ["ss", "s", "m", "l", "xl", "xxl", "xxxl", ""],
        },
        stock: {
          type: Number,
          default: 0,
        },
        totalAmount: {
          type: Number,
          default: 0
        },
        soldItems: {
          type: Number,
          default: 0
        }
      }]
    },
    stock: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    soldItems: {
      type: Number,
      default: 0
    },
    mainImage: { type: { secure_url: String, public_id: String } },
    images: { type: [{ secure_url: String, public_id: String }] },
  },
  {
    timestamps: true,
  }
);

const colorModel = model("color", colorSchema);
export default colorModel;
