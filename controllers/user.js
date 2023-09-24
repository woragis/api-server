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

module.exports = { createAccount };
