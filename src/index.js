import express from "express";
import "dotenv/config";
import appMiddleware from "./middleware/index.js";
import bodyParser from "body-parser";

import path from "path";
import url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "../public")));

app.use(appMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
