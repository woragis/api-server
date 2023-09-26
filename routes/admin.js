const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUser,
  registerUser,
  updateUser,
  deleteUser,
} = require("../controllers/admin");

router.route("/users").get(getUsers);
router.route("/users/create").post(registerUser);
router
  .route("/users/:id")
  .get(getUser)
  .put(updateUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
