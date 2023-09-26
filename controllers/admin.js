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

const registerUser = async (req, res) => {
  const { email, password } = req.body;

  const client = await pool.connect();

  try {
    client.query(checkIfEmailExists, [email], (err, result) => {
      if (err) res.locals.serverError;

      const { email_exists } = result.rows[0];
      if (email_exists) {
        res.status(400).json({ message: "email already exists, try again" });
      } else {
        const hashedPassword = bcrypt.hashSync(password, salt);
        client.query(
          registerUserInDB,
          [email, hashedPassword],
          (err, result) => {
            if (err) res.locals.serverError;
            res.status(201).json([
              { message: "user created" },
              {
                email: email,
                password: password,
                hashedPassword: hashedPassword,
              },
            ]);
          }
        );
      }
    });
  } catch (err) {
    res.locals.serverError;
  } finally {
    client.release();
  }
};

const getUser = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    client.query(getUserQuery, [id], (err, result) => {
      if (err) res.locals.serverError;
      res.json(result.rows);
    });
  } catch (err) {
    res.locals.serverError;
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
      client.query(checkIfEmailChanged, [id, email], (err, result) => {
        if (err) res.locals.serverError;

        const { email_changed } = result.rows[0];
        if (!email_changed) {
          res.status(400).json({ message: "email is the same" });
        } else {
          client.query(
            checkIfEmailAlreadyExists,
            [id, email],
            (err, result) => {
              const { email_already_exists } = result.rows[0];
              if (email_already_exists) {
                res.status(400).json({ message: "email already exists" });
              } else {
                if (password) {
                  console.log("modifying email and password");
                  const hashedPassword = bcrypt.hashSync(password, salt);
                  client.query(
                    updateUserEmailPasswordQuery,
                    [id, email, hashedPassword],
                    (err, result) => {
                      if (err) res.locals.serverError;
                      else {
                        res
                          .status(202)
                          .json([
                            { message: `Updated user ${id}` },
                            result.rows,
                          ]);
                      }
                    }
                  );
                } else {
                  client.query(
                    updateUserEmailQuery,
                    [id, email],
                    (err, result) => {
                      if (err) res.locals.serverError;
                      res
                        .status(202)
                        .json([{ message: `Updated user ${id}` }, result.rows]);
                    }
                  );
                }
              }
            }
          );
        }
      });
    } else if (password) {
      const hashedPassword = bcrypt.hashSync(password, salt);
      client.query(
        updateUserPasswordQuery,
        [id, hashedPassword],
        (err, result) => {
          res.status(202).json(result.rows);
        }
      );
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
    client.query(deleteUserQuery, [id], (err, result) => {
      res.status(200).json({ message: "User deleted" });
    });
  } catch (err) {
    res.status(500).json(err);
  } finally {
    client.release();
  }
};

module.exports = { getUsers, getUser, registerUser, updateUser, deleteUser };
