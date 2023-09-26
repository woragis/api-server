require("dotenv").config();
const bcrypt = require("bcrypt");
const { Client } = require("pg");

const userTable = process.env.POSTGRES_DATABASE_TABLE_ACCOUNT;
// database queries:
const checkIfEmailExists = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE email=$1) as email_exists;`;
const getPassword = `SELECT password FROM ${userTable} WHERE email=$1;`;
// create user :)
const createUserInDB = `INSERT INTO ${userTable} (email, password) VALUES ($1, $2)`;

// const salt = bcrypt.genSalt(10);

const registerUser = async (req, res) => {
  const { email, password } = req.body;

  const client = new Client({
    host: process.env.POSTGRES_DATABASE_HOST,
    port: process.env.POSTGRES_DATABASE_PORT,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_DATABASE_USER,
    password: process.env.POSTGRES_DATABASE_USER_PASSWORD,
  });

  try {
    await client.connect();
    const resultCheckIfEmailExists = await client.query(checkIfEmailExists, [
      email,
    ]);
    const { email_exists } = resultCheckIfEmailExists.rows[0];
    if (!email_exists) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      client.query(createUserInDB, [email, hashedPassword], (err, result) => {
        res
          .status(201)
          .json([
            { message: "created user" },
            { email: email, password: password },
          ]);
      });
    } else if (email_exists) {
      res.status(400).json({ message: "email already exists, try again" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const client = new Client({
    host: process.env.POSTGRES_DATABASE_HOST,
    port: process.env.POSTGRES_DATABASE_PORT,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_DATABASE_USER,
    password: process.env.POSTGRES_DATABASE_USER_PASSWORD,
  });

  try {
    await client.connect();

    const resultCheckIfEmailExists = await client.query(checkIfEmailExists, [
      email,
    ]);
    const { email_exists } = resultCheckIfEmailExists.rows[0];
    if (email_exists) {
      const resultDBPassword = await client.query(getPassword, [email]);
      const dbPassword = resultDBPassword.rows[0].password;
      const isPasswordCorrect = bcrypt.compareSync(password, dbPassword);
      if (isPasswordCorrect) {
        res
          .status(200)
          .json([
            { message: "logged in" },
            { email: email, password: password },
          ]);
      } else if (!isPasswordCorrect) {
        res.status(400).json({ message: "wrong/invalid password" });
      }
    } else if (!email_exists) {
      res.status(400).json({ message: "wrong/invalid email" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
};

module.exports = { registerUser, loginUser };
