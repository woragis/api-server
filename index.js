require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const express = require("express");
const app = express();
const server_port = process.env.EXPRESS_SERVER_PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const user = require("./routes/user");
app.use("/user", user);
const admin = require("./routes/admin");
app.use("/admin", admin);

app.listen(server_port, () => {
  console.log(`Server Running on port ${server_port}`);
});
