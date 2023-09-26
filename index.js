require("dotenv").config();
const bcrypt = require("bcrypt");
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const app = express();
const server_port = process.env.EXPRESS_SERVER_PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "woragis2004password2000",
    resave: true,
    saveUninitialized: true,
    cookie: { sameSite: "none", secure: false },
  })
);

app.get("/", (req, res) => {
  res.locals;
  console.log(`Cookies: ${req.session.cookie}`);
  console.log(`Session: ${req.session.save((err) => console.error(err))}`);
  console.log(`Session Id: ${req.sessionID}`);
  console.log("Get /");
});

// cookie middleware
// const newCookie = (req, res, next) => {
//   res.cookie("cookieName", 1, { maxAge: 1000 * 60 * 2 });
//   console.log(`Cookie: ${req.cookies}`);
//   next();
// };
// app.use(newCookie);
const user = require("./routes/user");
app.use("/user", user);
const admin = require("./routes/admin");
app.use("/admin", admin);

app.listen(server_port, () => {
  console.log(`Server Running on port ${server_port}`);
});
