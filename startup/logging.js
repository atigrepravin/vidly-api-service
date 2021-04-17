const winston = require("winston");
require("winston-mongodb");
require("express-async-errors");
const config = require("config");

module.exports = function () {
  winston.exceptions.handle(
    new winston.transports.Console(),
    new winston.transports.File({ filename: "uncaughtException.log" })
  );

  process.on("unhandledRejection", function (ex) {
    throw ex;
  });

  winston.add(
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logfile.log" })
  );
  winston.add(
    new winston.transports.MongoDB({
      db: config.get("db"),
      level: "info",
    })
  );
};
