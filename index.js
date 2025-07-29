import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bootstrap from "./src/modules/index.router.js";
import connectDB from "./DB/Conniction.js";
// Set directory direname
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "./config/.env") });
const app = express();
const port = process.env.PORT || 3000;

bootstrap(app, express);
connectDB();
app.listen(port, () => {
  console.log(`Example app listen on port ${port}`);
});


// const products = [
//   { id: 1, colorCode: "#ccc", size: "m" },
//   { id: 2, colorCode: "#ccc", size: "m" },
//   { id: 3, colorCode: "#ccc", size: "m" },
//   { id: 4, colorCode: "#ccc", size: "m" },
//   { id: 4, colorCode: "#ccc", size: "s" },
//   { id: 4, colorCode: "#ccf", size: "s" },
//   { id: 5, colorCode: "#ccc", size: "m" },
//   { id: 6, colorCode: "#ccc", size: "m" },
//   { id: 7, colorCode: "#ccc", size: "m" },
// ]

// const productsIds = []

// for (const product of products) {
//   const exists = productsIds.some(
//     (productTest) =>
//       productTest.id === product.id &&
//       productTest.colorCode === product.colorCode &&
//       productTest.size === product.size
//   );
//   if (exists) {
//     console.log("Dupplicated");
//     break;
//   } else {
//     productsIds.push({ id: product.id, colorCode: product.colorCode, size: product.size });
//   }
// }
// console.log(productsIds);


// JJAG3UF2N8GEEELHMWL4E9TF