require("dotenv").config();
const { Pool } = require("pg");

const userTable = process.env.POSTGRES_DATABASE_TABLE_ACCOUNT;
const pool = new Pool({
  host: process.env.POSTGRES_DATABASE_HOST,
  port: process.env.POSTGRES_DATABASE_PORT,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_DATABASE_USER,
  password: process.env.POSTGRES_DATABASE_USER_PASSWORD,
});

const createAccount = async (req, res) => {
  const { email, password } = req.body;
  const client = await pool.connect();
  const createAccountQuery = `INSERT INTO ${userTable} (email, password) VALUES ($1, $2);`;
  try {
    client.query(createAccountQuery, [email, password], (err, result) => {
      if (err) {
        res.status(500).json({ error: "Error creating user" });
      } else {
        res.status(201).json({ message: "Created user" });
      }
    });
  } catch (error) {
    console.error(error);
  } finally {
    client.release();
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const client = await pool.connect();
  const loginUserEmailQuery = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE email=$1) as email_exists;`;
  const loginUserPasswordQuery = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE email=$1 AND password=$2) as correct_password;`;
  try {
    if (client.query(loginUserEmailQuery, email)) {
      client.query(loginUserPasswordQuery, [email, password], (err, result) => {
        if (err) {
          console.error(err);
          res.status(401).json({ error: "Wrong Password" });
        }
      });
    } else {
      res.status(401).json({ error: "Email not found" });
    }
  } catch (error) {
    console.error(error);
  } finally {
    client.release();
  }
};

module.exports = { createAccount, loginUser };
