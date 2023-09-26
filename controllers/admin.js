require("dotenv").config();
const bcrypt = require("bcrypt");
const { Client, Pool } = require("pg");

const client = new Client({
  host: process.env.POSTGRES_DATABASE_HOST,
  port: process.env.POSTGRES_DATABASE_PORT,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_DATABASE_USER,
  password: process.env.POSTGRES_DATABASE_USER_PASSWORD,
});

const pool = new Pool({
  host: process.env.POSTGRES_DATABASE_HOST,
  port: process.env.POSTGRES_DATABASE_PORT,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_DATABASE_USER,
  password: process.env.POSTGRES_DATABASE_USER_PASSWORD,
});

const userTable = process.env.POSTGRES_DATABASE_TABLE_ACCOUNT;
// get all users
const getUsersQuery = `SELECT * FROM ${userTable};`;
// get single user
const getUserQuery = `SELECT * FROM ${userTable} WHERE account_id=$1;`;
// for register
const checkIfEmailExists = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE email=$1) as email_exists;`;
const registerUserInDB = `INSERT INTO ${userTable} (email, password) VALUES ($1, $2) RETURNING *;`;
// for update
const checkIfEmailChanged = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE account_id=$1 AND email!=$2) as email_changed;`;
const checkIfEmailAlreadyExists = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE account_id!=$1 AND email=$2) as email_already_exists;`;
const updateUserEmailQuery = `UPDATE ${userTable} SET email=$2 WHERE account_id=$1 RETURNING *;`;
const updateUserEmailPasswordQuery = `UPDATE ${userTable} SET email=$2, password=$3 WHERE account_id=$1 RETURNING *;`;
const updateUserPasswordQuery = `UPDATE ${userTable} SET password=$2 WHERE account_id=$1 RETURNING *;`;
// for delete
const deleteUserQuery = `DELETE FROM ${userTable} WHERE account_id=$1;`;

const salt = bcrypt.genSaltSync(10);

const getUsers = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = client.query(getUserQuery);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

const registerUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    await client.connect();
    const checkEmail = await client.query(checkIfEmailExists, [email]);
    const { email_exists } = checkEmail.rows[0];
    if (!email_exists) {
      const hashedPassword = bcrypt.hashSync(password, salt);
      client.query(registerUserInDB, [email, hashedPassword]);
      res.status(201).json([
        { message: "user created" },
        {
          email: email,
          password: hashedPassword,
        },
      ]);
    } else {
      res.status(400).json({ message: "email already exists, try again" });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

const getUser = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(getUserQuery, [id]);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server internal error" });
  } finally {
    client.release();
  }
  pool.end();
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;

  try {
    await client.connect();
    if (email) {
      const resultCheckIfEmailChanged = await client.query(
        checkIfEmailChanged,
        [id, email]
      );
      const { email_changed } = resultCheckIfEmailChanged.rows[0];
      if (email_changed) {
        const resultCheckIfEmailAlreadyExists = await client.query(
          checkIfEmailAlreadyExists,
          [id, email]
        );
        const { email_already_exists } =
          resultCheckIfEmailAlreadyExists.rows[0];
        if (!email_already_exists) {
          if (password) {
            const hashedPassword = bcrypt.hashSync(password, salt);
            client.query(
              updateUserEmailPasswordQuery,
              [id, email, hashedPassword],
              (err, result) => {
                res
                  .status(202)
                  .json([{ message: `Updated user ${id}` }, result.rows]);
              }
            );
          } else {
            client.query(updateUserEmailQuery, [id, email], (err, result) => {
              res
                .status(202)
                .json([{ message: `Updated user ${id}` }, result.rows]);
            });
          }
        } else if (email_already_exists) {
          res.status(400).json({ message: "email already exists" });
        }
      } else if (!email_changed) {
        res.status(400).json({ message: "email is the same" });
      }
    } else if (password) {
      const hashedPassword = bcrypt.hashSync(password, salt);
      client.query(
        updateUserPasswordQuery,
        [id, hashedPassword],
        (err, result) => {
          res
            .status(202)
            .json([{ message: `Updated user ${id}` }, result.rows]);
        }
      );
    } else {
      res.status(400).json({ message: "Provide values" });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await client.end();
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await client.connect();
    await client.query(deleteUserQuery, [id]);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server internal error" });
  } finally {
    await client.end();
  }
};

module.exports = { getUsers, getUser, registerUser, updateUser, deleteUser };
