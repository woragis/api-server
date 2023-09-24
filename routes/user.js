const express = require("express");
const router = express.Router();

const { createAccount, loginUser } = require("../controllers/user");

router.route("/register").post(createAccount);
router.route("/login").post(loginUser);

module.exports = router;
