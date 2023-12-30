var express = require("express");
var router = express.Router();
var User = require("../models/user");

router.get('/', (req, res, next) => {
    res.render('dashboard', {users: []});
})

module.exports = router;