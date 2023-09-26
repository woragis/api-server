const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  profile,
  loggout,
} = require("../controllers/user");

router.route("/profile").get(profile);
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/loggout").get(loggout);

module.exports = router;
