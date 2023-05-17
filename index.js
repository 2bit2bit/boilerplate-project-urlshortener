require("dotenv").config();
const express = require("express");
var fs = require("fs");
const dns = require("node:dns");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");

// Basic Configuration
const port = process.env.PORT || 8080;
MONGODB_URI = process.env.MONGODB_URI;

const Schema = mongoose.Schema;
const ShortUrl = mongoose.model(
  "ShortUrl",
  new Schema({
    short_url: Number,
    original_url: String,
  })
);

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api/shorturl/:id", async (req, res) => {
  //check url with the id and redirect to there
  //extract the id
  const id = req.params.id;
  //access db and find url at index of id
  const short_url = await ShortUrl.findOne({
    short_url: id,
  })

  if (short_url) {
    res.redirect(short_url.original_url);
  } else {
    res.json({
      error: "No short URL found for the given input",
    });
  }
});

app.post("/api/shorturl", async (req, res) => {
  try {
    //get url
    const original_url = req.body.url;
    //if url is invalid SEND { error: "invalid url" }
    if (original_url.split("/")[2]) {
      await dns.promises.lookup(original_url.split("/")[2]);
    } else {
      throw new Error("invalid url");
    }
    //if url is valid check if url exist in database
    const shortenedUrl = await ShortUrl.findOne({
      original_url: original_url,
    });
    //if it exist gets id and SEND { original_url: original_url, short_url: id }
    if (shortenedUrl) {
      res.json({
        original_url: original_url,
        short_url: shortenedUrl.short_url,
      });
    } else {
      //if it dosen't exist ADD it to database and SEND { original_url: original_url, short_url: id }
      const newUrl = new ShortUrl({
        original_url: original_url,
        short_url: await ShortUrl.find().count(),
      });
      await newUrl.save();
      res
        .status(201)
        .json({
          original_url: newUrl.original_url,
          short_url: newUrl.short_url,
        });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: "invalid url" });
  }
});

mongoose.connect(MONGODB_URI).then(() => {
  app.listen(port, function () {
    console.log(`Listening on port ${port}`);
  });
});
