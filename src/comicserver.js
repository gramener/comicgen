#!/usr/bin/env node

/* eslint-disable no-console */

const comicgen = require("./comicgen")(require("fs"));
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const sharp = require("sharp");
const winston = require("winston");
require("winston-daily-rotate-file");

const port = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..")));

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: "comicgen-%DATE%.log", // Save in current folder
      datePattern: "YYYY-MM", // Monthly archives
      maxFiles: 12, // For 12 months
      zippedArchive: true, // GZip the archives
    }),
  ],
});

app.get("/comic", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  const start = new Date();
  let result, duration;
  try {
    result = comicgen(req.query);
  } catch (e) {
    return handleException(e, req, res, start);
  }
  res.set("Cache-Control", "public, max-age=3600");
  if (req.query.ext && req.query.ext.match(/png/i)) {
    try {
      result = await sharp(Buffer.from(result, "utf8")).toFormat("png", { colors: 256 }).toBuffer();
      res.set("Content-Type", "image/png");
    } catch (e) {
      return handleException(e, req, res, start);
    }
  } else {
    res.set("Content-Type", "image/svg+xml");
  }
  res.send(result);
  duration = +new Date() - start;
  logger.info(`${start.toISOString()} ${duration} ${req.url}`);
});

app.listen(port, () => {
  const start = new Date();
  const welcome = `${start.toISOString()} Started http://localhost:${port}`;
  logger.info(welcome);
  console.log(welcome);
});

function handleException(e, req, res, start) {
  let duration = +new Date() - start;
  let error = e.toString().trim();
  logger.error(`${start.toISOString()} ${duration} ${req.url} ${error}`);
  res.set("Content-Type", "text/plain");
  res.send(error);
}
