require("dotenv").config();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const userTable = process.env.POSTGRES_DATABASE_TABLE_ACCOUNT;
const pool = new Pool({
  host: process.env.POSTGRES_DATABASE_HOST,
  port: process.env.POSTGRES_DATABASE_PORT,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_DATABASE_USER,
  password: process.env.POSTGRES_DATABASE_USER_PASSWORD,
});

// database queries:
const checkIfEmailExists = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE email=$1) as email_exists;`;
const getPassword = `SELECT password FROM ${userTable} WHERE email=$1;`;

const createUserInDB = `INSERT INTO ${userTable} (email, password) VALUES ($1, $2)`;

const saltRounds = 10;

const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const client = await pool.connect();

  try {
    client.query(checkIfEmailExists, [email], (err, result) => {
      if (err) res.status(500).json({ message: "Internal server error" });
      const { email_exists } = result.rows[0];
      if (email_exists) {
        res.status(400).json({ message: "email already exists, try again" });
      } else {
        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        client.query(createUserInDB, [email, hashedPassword], (err, result) => {
          if (err) res.status(500).json({ message: "Internal server error" });
          res
            .status(201)
            .json([
              { message: "created user" },
              { email: email, password: password },
            ]);
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const client = await pool.connect();

  try {
    client.query(checkIfEmailExists, [email], (err, result) => {
      if (err) res.status(400).json({ error: "badRequest" });
      const { email_exists } = result.rows[0];
      if (!email_exists) {
        res.status(400).json({ message: "wrong/invalid email" });
      } else {
        client.query(getPassword, [email], (err, result) => {
          const dbPassword = result.rows[0].password;
          const isPasswordCorrect = bcrypt.compareSync(password, dbPassword);
          if (!isPasswordCorrect) {
            res.status(400).json({ message: "wrong/invalid password" });
          } else {
            res
              .status(200)
              .json([
                { message: "logged in" },
                { email: email, password: password },
              ]);
          }
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

module.exports = { registerUser, loginUser };
