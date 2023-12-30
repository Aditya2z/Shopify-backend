const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = {
  isLoggedIn: function (req, res, next) {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required! Login first.",
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Invalid token. Authentication failed.",
        });
      }
      
      next();
    });
  },

  userInfo: function (req, res, next) {
    const token = req.header("Authorization");

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return next();
        }

        User.findById(decoded.userId, "-password")
          .then((user) => {
            req.user = user;
            res.locals.user = user;
            next();
          })
          .catch((err) => {
            next(err);
          });
      });
    } else {
      next();
    }
  },

  isAdmin: function (req, res, next) {
    User.findById(req.user._id)
      .then((user) => {
        if (user && user.isAdmin) {
          next();
        } else {
          return res.status(403).json({
            success: false,
            message: "Access Not authorized!",
          });
        }
      })
      .catch((err) => {
        next(err);
      });
  },

  isBlocked: (req, res, next) => {
    const { email } = req.body;
    User.findOne({ email })
      .then((user) => {
        if (user && user.isBlocked) {
          return res.status(403).json({
            success: false,
            message: "Your Account has been suspended.",
          });
        } else {
          next();
        }
      })
      .catch((err) => {
        next(err);
      });
  },
};

module.exports = auth;
