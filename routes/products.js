var express = require("express");
var router = express.Router();
var Product = require("../models/product");
var Cart = require("../models/cart");
var auth = require("../middlewares/auth");

/* GET products listing. */
router.get("/", function (req, res, next) {
  remove = req.user ? "" : "-liked";

  const selectedCategory = req.query.category;
  let query = selectedCategory ? { category: selectedCategory } : {};

  Product.find(query, remove)
    .then((productList) => {
      return Promise.all(
        productList.map((product) => {
          if (req.user) {
            const userId = req.user._id;
            const productId = product._id;
            const isUserLiked = product.likedBy.includes(userId);

            return Product.findByIdAndUpdate(
              productId,
              { $set: { liked: isUserLiked } },
              { new: true }
            ).then((updatedProduct) => {
              return updatedProduct;
            });
          } else {
            return product;
          }
        })
      );
    })
    .then((productList) => {
      const allCategories = new Set();

      productList.forEach((product) => {
        product.category.forEach((category) => {
          allCategories.add(category);
        });
      });

      res.json({
        success: true,
        products: productList,
        allCategories: Array.from(allCategories),
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ success: false, error: err.message });
    });
});

/* Create product. */
router.post("/", auth.isAdmin, function (req, res, next) {
  req.body.category = req.body.category.trim().split(" ");
  Product.create(req.body)
    .then((newProduct) => {
      res.json({ success: true, product: newProduct });
    })
    .catch((err) => {
      res.status(500).json({ success: false, error: err.message });
    });
});

router.get("/categories", auth.isAdmin, (req, res, next) => {
  Product.find({})
    .then((productList) => {
      const allCategories = new Set();

      productList.forEach((product) => {
        product.category.forEach((category) => {
          allCategories.add(category);
        });
      });

      res.json({
        success: true,
        allCategories: Array.from(allCategories),
      });
    })
    .catch((err) => {
      res.status(500).json({ success: false, error: err.message });
    });
});

// Get Single Product Details
router.get("/:id", function (req, res, next) {
  Product.findById(req.user._id)
    .then((product) => {
      res.json({ success: true, product: product });
    })
    .catch((err) => {
      res.status(500).json({ success: false, error: err.message });
    });
});

//Update Product
router.post("/:id", auth.isAdmin, function (req, res, next) {
  req.body.category = req.body.category.trim().split(" ");
  Product.findByIdAndUpdate(req.user._id, req.body, { new: true })
    .then((updatedProduct) => {
      res.json({ success: true, product: updatedProduct });
    })
    .catch((err) => {
      res.status(500).json({ success: false, error: err.message });
    });
});

//Delete Product
router.get("/:id/delete", auth.isAdmin, function (req, res, next) {
  Product.findByIdAndDelete(req.user._id)
    .then((deletedProduct) => {
      Comment.deleteMany({ articleId: deletedProduct._id })
        .then(() => {
          res.json({ success: true, message: "Product deleted successfully" });
        })
        .catch((err) => {
          res.status(500).json({ success: false, error: err.message });
        });
    })
    .catch((err) => {
      res.status(500).json({ success: false, error: err.message });
    });
});

// Handle Likes
router.put("/:id/like", auth.isLoggedIn, function (req, res, next) {
  const productId = req.params.id;
  const userId = req.user._id;

  Product.findById(productId)
    .then((foundProduct) => {
      if (!foundProduct) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }
      // Check if user already liked the product
      const isUserLiked = foundProduct.likedBy.includes(userId);

      return Product.findByIdAndUpdate(
        productId,
        {
          $inc: { likes: isUserLiked ? 0 : 1 },
          $addToSet: isUserLiked ? {} : { likedBy: userId },
          $set: { liked: !isUserLiked },
        },
        { new: true }
      );
    })
    .then((updatedProduct) => {
      res.json({ success: true, product: updatedProduct });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ success: false, error: err.message });
    });
});

// Handle Unlikes
router.delete("/:id/like", auth.isLoggedIn, function (req, res, next) {
  const productId = req.params.id;
  const userId = req.user._id;

  Product.findById(productId)
    .then((foundProduct) => {
      if (!foundProduct) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }

      // Check if user already liked the product
      const isUserLiked = foundProduct.likedBy.includes(userId);

      return Product.findByIdAndUpdate(
        productId,
        {
          $inc: { likes: isUserLiked ? -1 : 0 },
          $pull: isUserLiked ? { likedBy: userId } : {},
          $set: { liked: !isUserLiked },
        },
        { new: true }
      );
    })
    .then((updatedProduct) => {
      res.json({ success: true, product: updatedProduct });
    })
    .catch((err) => {
      res.status(500).json({ success: false, error: err.message });
    });
});

module.exports = router;
