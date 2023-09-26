require("dotenv").config();
const bcrypt = require("bcrypt");
const session = require("express-session");
const { Client } = require("pg");

const userTable = process.env.POSTGRES_DATABASE_TABLE_ACCOUNT;
// database queries:
const checkIfEmailExists = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE email=$1) as email_exists;`;
const getPassword = `SELECT * FROM ${userTable} WHERE email=$1;`;
// create user :)
const createUserInDB = `INSERT INTO ${userTable} (email, password) VALUES ($1, $2) RETURNING *;`;

// const salt = bcrypt.genSalt(10);

const registerUser = async (req, res) => {
  if (req.session.userId) {
    res.status(200).json({ message: "you're already logged in" });
  } else {
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
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await client.query(createUserInDB, [
          email,
          hashedPassword,
        ]);
        const userId = result.rows[0].account_id;
        req.session.userId = userId;
        res
          .status(201)
          .json([
            { message: "created user" },
            { email: email, password: password },
            { userId: userId },
          ]);
      } else if (email_exists) {
        res.status(400).json({ message: "email already exists, try again" });
      }
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    } finally {
      await client.end();
    }
  }
};

const loginUser = async (req, res) => {
  if (req.session.userId) {
    res.status(200).json({ message: "you're already logged in" });
  } else {
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
        const userId = resultDBPassword.rows[0].account_id;
        bcrypt.compare(password, dbPassword, (err, same) => {
          if (same) {
            req.session.userId = userId;
            res
              .status(200)
              .json([
                { message: "logged in" },
                { email: email, password: password },
                { userId: userId },
              ]);
          } else if (!same) {
            res.status(400).json({ message: "wrong/invalid password" });
          }
        });
      } else if (!email_exists) {
        res.status(400).json({ message: "wrong/invalid email" });
      }
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    } finally {
      await client.end();
    }
  }
};
const GET_USER = `SELECT * FROM ${userTable} WHERE account_id=$1;`;
const profile = async (req, res) => {
  const userId = req.session.userId;
  if (userId) {
    const client = new Client({
      host: process.env.POSTGRES_DATABASE_HOST,
      port: process.env.POSTGRES_DATABASE_PORT,
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_DATABASE_USER,
      password: process.env.POSTGRES_DATABASE_USER_PASSWORD,
    });
    try {
      await client.connect();
      const { rows } = await client.query(GET_USER, [userId]);
      res.status(202).json(rows);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    } finally {
      await client.end();
    }
  } else if (!userId) {
    res.status(403).json({ message: "you need to login" });
  }
};

const loggout = async (req, res) => {
  if (req.session.userId) {
    req.session.destroy();
    res.status(200).json({ message: "you've logged out" });
  } else {
    res.status(400).json({ message: "you're already logged out" });
  }
};

module.exports = { registerUser, loginUser, profile, loggout };
