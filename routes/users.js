var express = require("express");
var router = express.Router();
var User = require("../models/user");
var auth = require("../middlewares/auth");
var jwt = require("jsonwebtoken");
require("dotenv").config();

/* GET users listing. */
router.get("/", auth.isLoggedIn, auth.isAdmin, function (req, res, next) {
  User.find({}, "-password")
    .then((userlist) => {
      res.json({ success: true, users: userlist });
    })
    .catch((err) => {
      res.status(500).json({ success: false, error: err.message });
    });
});

/* GET current user. */
router.get("/user", auth.isLoggedIn, function (req, res, next) {
  const userId = req.user.id;


  User.findById(userId, "-password")
    .then((user) => {
      res.json({ success: true, user: user });
    })
    .catch((err) => {
      res.status(500).json({ success: false, error: err.message });
    });
});

// Sign-up new user
router.post("/register", function (req, res, next) {
  const { email, firstname, lastname, password } = req.body;

  // Get fullname of user
  if (lastname) {
    req.body.name = firstname + " " + lastname;
  } else {
    req.body.name = firstname;
  }

  // Check if the email is already registered
  User.findOne({ email })
    .then((user) => {
      if (user) {
        // Email is already registered
        const error = new Error(
          "Email is already registered. Please use a different email."
        );
        error.status = 400; // Bad Request
        return next(error);
      }

      // Check if the password is less than 6 characters
      if (password.length < 6) {
        const error = new Error(
          "Password should be at least 6 characters long."
        );
        error.status = 400; // Bad Request
        return next(error);
      }

      // Proceed with registration if everything is valid
      User.create(req.body)
        .then((newUser) => {
          res.json({
            success: true,
            message: "User registered successfully. You can now log in.",
            user: newUser,
          });
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err);
    });
});

// User Login
router.post("/login", auth.isBlocked, function (req, res, next) {
  var { email, password } = req.body;
  if (!email || !password) {
    const error = new Error("Email/Password Required!");
    error.status = 400; // Bad Request
    return next(error);
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        const error = new Error("Email not registered");
        error.status = 404; // Not Found
        return next(error);
      }

      user.verifyPassword(password, (err, result) => {
        if (err) return next(err);
        if (!result) {
          const error = new Error("Wrong Password!");
          error.status = 401; // Unauthorized
          return next(error);
        }

        // Create a JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
          expiresIn: "3d",
        });

        res.json({ success: true, user: user, token: token });
      });
    })
    .catch((err) => {
      next(err);
    });
});


// Block a user
router.get("/:id/block", auth.isAdmin, (req, res, next) => {
  User.findById(req.params.id)
    .then((user) => {
      user.isBlocked = !user.isBlocked;
      user.save();
      res.json({
        success: true,
        message: "User blocked/unblocked successfully",
      });
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        message: "An error occurred. Please try again.",
        error: err.message,
      });
    });
});

module.exports = router;
