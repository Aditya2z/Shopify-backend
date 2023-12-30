const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Product = require("../models/product");
const Cart = require("../models/cart");

// Get cart items
router.get("/", auth.isLoggedIn, (req, res, next) => {
  const userId = req.user._id;
  console.log(userId);

  Cart.findOne({ user: userId })
    .populate("items.product")
    .then((cart) => {
      if (!cart) {
        cart = new Cart({ user: userId });
        cart.save(); 
      }

      res.json({
        success: true,
        cart: cart,
      });
    })
    .catch((err) => {
      const error = new Error("An error occurred while fetching cart items.");
      error.status = 500;
      error.inner = err;
      return next(err);
    });
});

// Add a product to the user's cart
router.post("/:productId", auth.isLoggedIn, (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user._id;

  // Validate if the product exists
  Product.findById(productId)
    .then((product) => {
      if (!product) {
        const error = new Error("Product not found");
        error.status = 404;
        return next(error);
      }

      return Cart.findOne({ user: userId });
    })
    .then((cart) => {
      if (!cart) {
        // If the user doesn't have a cart, create a new one
        cart = new Cart({ user: userId });
      }

      const existingCartItem = cart.items.find((cartItem) =>
        cartItem.product.equals(productId)
      );

      if (existingCartItem) {
        existingCartItem.quantity += 1;
      } else {
        const newCartItem = {
          product: productId,
          quantity: 1,
        };

        cart.items.push(newCartItem);
      }

      return cart.save();
    })
    .then(async (cart) => {
      await cart.populate("items.product");
      res.json({
        success: true,
        cart: cart,
      });
    })
    .catch((error) => {
      next(error);
    });
});

// Increase the quantity of a product in the user's cart
router.put("/increase/:productId", auth.isLoggedIn, (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user._id;

  Cart.findOne({ user: userId })
    .populate("items.product")
    .then((cart) => {
      if (!cart) {
        const error = new Error("Cart not found for the user.");
        error.status = 404;
        return next(error);
      }

      // Find the cart item with the specified productId
      const cartItem = cart.items.find((item) =>
        item.product.equals(productId)
      );

      if (!cartItem) {
        const error = new Error("Product not found in the user's cart.");
        error.status = 404;
        return next(error);
      }

      cartItem.quantity += 1;

      return cart.save();
    })
    .then((updatedCart) => {
      res.json({
        success: true,
        message: "Quantity increased in the cart successfully.",
        cart: updatedCart,
      });
    })
    .catch((err) => {
      next(err);
    });
});

// Decrease the quantity of a product in the user's cart
router.put("/decrease/:productId", auth.isLoggedIn, (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user._id;

  Cart.findOne({ user: userId })
    .populate("items.product")
    .then(async (cart) => {
      if (!cart) {
        const error = new Error("Cart not found for the user.");
        error.status = 404;
        return next(error);
      }

      const cartItem = cart.items.find((item) =>
        item.product.equals(productId)
      );

      if (!cartItem) {
        const error = new Error("Product not found in the user's cart.");
        error.status = 404;
        return next(error);
      }

      cartItem.quantity = Math.max(1, cartItem.quantity - 1);

      if (cartItem.quantity === 0) {
        cart.items = cart.items.filter((item) => item.product._id != productId);
      }

      return cart.save();
    })
    .then((updatedCart) => {
      res.json({
        success: true,
        message: "Quantity decreased in the cart successfully.",
        cart: updatedCart,
      });
    })
    .catch((err) => {
      next(err);
    });
});

// Route to remove an item from the user's cart
router.delete("/:productId", auth.isLoggedIn, (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user._id;

  Cart.findOne({ user: userId })
    .populate("items.product")
    .then((cart) => {
      if (!cart) {
        const error = new Error("Cart not found for the user.");
        error.status = 404;
        return next(error);
      }

      cart.items = cart.items.filter((item) => item.product._id != productId);

      return cart.save();
    })
    .then((updatedCart) => {
      res.json({
        success: true,
        message: "Item removed from the cart successfully.",
        cart: updatedCart,
      });
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
