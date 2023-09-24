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

const getUsersQuery = `SELECT * FROM ${userTable};`;
const checkIfUserExists = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE user_id=$1) as user_exists;`;
const checkIfEmailExists = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE email=$1) as email_exists;`;
const createUserQuery = `INSERT INTO ${userTable} (email, password) VALUES ($1, $2);`;
const getUserQuery = `SELECT * FROM ${userTable} WHERE user_id=$1;`;
const updateUserEmailQuery = `UPDATE ${userTable} SET email=$2 WHERE user_id=$1;`;
const updateUserPasswordQuery = `UPDATE ${userTable} SET password=$2 WHERE user_id=$1;`;
const updateUserEmailPasswordQuery = `UPDATE ${userTable} SET email=$2, password=$3 WHERE user_id=$1;`;
const deleteUserQuery = `DELETE FROM ${userTable} WHERE user_id=$1;`;

const getUsers = async (req, res) => {
  const client = await pool.connect();
  try {
    client.query(getUsersQuery, (err, result) => {
      if (err) {
        res.status(500).json({ message: "Internal server error" });
      }
      res.status(200).json(result.rows);
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

const createUser = async (req, res) => {
  const { email, password } = req.body;
  const client = await pool.connect();
  try {
    client.query(checkIfEmailExists, [email], (err, result) => {
      const { email_exists } = result.rows[0];
      if (email_exists) {
        res.status(400).json({ message: "email already exists" });
      }
      client.query(createUserQuery, [email, password], (err, result) => {
        res.status(201).json(result.rows);
      });
    });
  } catch (err) {
    res.status(500).json(err);
  } finally {
    client.release();
  }
};

const getUser = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    client.query(getUserQuery, [id], (err, result) => {
      if (err) {
        res.status(500).json(err);
      }
      res.json(result.rows);
    });
  } catch (err) {
    res.status(500).json(err);
  } finally {
    client.release();
  }
};

module.exports = { getUsers, getUser, createUser };
