const { Router } = require("express");
const router = Router();

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
