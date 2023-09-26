const moment = require("moment");

const logger = (req, res, next) => {
  let now = moment().format("HH:mm:ss -- ddd, DD/MM/YYYY");
  console.log(
    `${req.method} ${req.protocol}/${req.hostname}${req.path} ____ ${now}`
  );
  next();
};
module.exports = logger;
