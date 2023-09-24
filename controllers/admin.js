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
const checkIfEmailIsEqual = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE user_id=$1 AND email=$2) as email_is_equal;`;
const checkIfPasswordIsEqual = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE user_id=$1 AND password=$2) as password_is_equal;`;
const checkIfEmailExists = `SELECT EXISTS (SELECT 1 FROM ${userTable} WHERE user_id!=$1 AND email=$2) as email_already_exists;`;
const createUserQuery = `INSERT INTO ${userTable} (email, password) VALUES ($1, $2) RETURNING *;`;
const getUserQuery = `SELECT * FROM ${userTable} WHERE user_id=$1;`;
const updateUserEmailQuery = `UPDATE ${userTable} SET email=$2 WHERE user_id=$1 RETURNING *;`;
const updateUserPasswordQuery = `UPDATE ${userTable} SET password=$2 WHERE user_id=$1 RETURNING *;`;
const updateUserEmailPasswordQuery = `UPDATE ${userTable} SET email=$2, password=$3 WHERE user_id=$1 RETURNING *;`;
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

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;
  const client = await pool.connect();
  try {
    if (email) {
      client.query(checkIfEmailIsEqual, [id, email], (err, result) => {
        const { email_is_equal } = result.rows[0];
        if (email_is_equal) {
          res.status(400).json({ message: "email is the same" });
        } else {
          client.query(checkIfEmailExists, [id, email], (err, result) => {
            const { email_exists } = result.rows[0];
            if (email_exists) {
              res.status(400).json({ message: "email already exists" });
            } else {
              if (password) {
                console.log("modifying email and password");
                client.query(
                  updateUserEmailPasswordQuery,
                  [id, email, password],
                  (err, result) => {
                    if (err) {
                      res.status(500).json(err);
                    } else {
                      res.json(result.rows);
                    }
                  }
                );
              } else {
                console.log("modifying email only, No password");
                client.query(
                  updateUserEmailQuery,
                  [id, email],
                  (err, result) => {
                    res.status(202).json(result.rows);
                  }
                );
              }
            }
          });
        }
      });
    } else if (password) {
      // check if password is changing
      client.query(checkIfPasswordIsEqual, [id, password], (err, result) => {
        const { password_is_equal } = result.rows[0];
        if (password_is_equal) {
          res.status(400).json({ message: "Password is equal" });
        } else {
          console.log("modifying password only, No email");
          client.query(
            updateUserPasswordQuery,
            [id, password],
            (err, result) => {
              res.status(202).json(result.rows);
            }
          );
        }
      });
    } else {
      res.status(400).json({ message: "Provide values" });
    }
  } catch (err) {
    res.status(500).json(err);
  } finally {
    client.release();
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    client.query(checkIfUserExists, [id], (err, result) => {
      const { user_exists } = result.rows[0];
      if (!user_exists) {
        res.status(400).json({ message: "User doesn't exists" });
      }
      client.query(deleteUserQuery, [id], (err, result) => {
        res.status(200).json({ message: "User deleted" });
      });
    });
  } catch (err) {
    res.status(500).json(err);
  } finally {
    client.release();
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
