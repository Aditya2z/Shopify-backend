const seedAdminUsers = require("./seedAdmin");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require('cors');
const mongoose = require("mongoose");
require("dotenv").config();
const auth = require("./middlewares/auth");

const usersRouter = require("./routes/users");
const productsRouter = require("./routes/products");
const adminRouter = require("./routes/admin");
const cartRouter = require("./routes/cart");

const app = express();
app.use(cors());

mongoose
  .connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@mongo-cluster.lcxzlbu.mongodb.net/shopify?retryWrites=true&w=majority`)
  .then(() => {
    console.log("Connected Successfully to shopify");
    seedAdminUsers();
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(auth.userInfo);

app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/cart", cartRouter);

app.use(function (req, res, next) {
  const customError = {
    message: "Not Found",
    status: 404,
  };

  next(customError);
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.json({
    message: err.message,
  });
});

module.exports = app;
