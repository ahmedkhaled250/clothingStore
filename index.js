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
