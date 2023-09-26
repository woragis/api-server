require("dotenv").config();
const bcrypt = require("bcrypt");
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const app = express();
const server_port = process.env.EXPRESS_SERVER_PORT;
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.POSTGRES_DATABASE_HOST,
  port: process.env.POSTGRES_DATABASE_PORT,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_DATABASE_USER,
  password: process.env.POSTGRES_DATABASE_USER_PASSWORD,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "sessions",
    }),
    secret: "woragis2004password2000",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 },
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
const logger = require("./middlewares/logger");
app.use(logger);
const user = require("./routes/user");
app.use("/user", user);
const admin = require("./routes/admin");
app.use("/admin", admin);

app.listen(server_port, () => {
  console.log(`Server Running on port ${server_port}`);
});
