require("dotenv").config();
const express = require("express");
var fs = require("fs");
const dns = require("node:dns");
const cors = require("cors");
const { json } = require("body-parser");
const app = express();

// Basic Configuration
const port = process.env.PORT || 80;

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

app.get("/api/shorturl/:id", function (req, res) {
  //check url with the id and redirect to there
  //extract the id
  const id = req.params.id;
  //access db and find url at index of id
  const database = JSON.parse(fs.readFileSync("./database.json"));
  const original_url = database[id];
  if (original_url) {
    res.redirect("http://" + original_url);
  } else {
    res.json({
      error: "No short URL found for the given input",
    });
  }
});

app.post("/api/shorturl", async (req, res) => {
  try {
    //get url
    const original_url = req.body.url.split('/')[2]
    console.log(original_url);
    //if url is invalid SEND { error: "invalid url" }
    await dns.promises.lookup(original_url);
    //if url is valid check if url exist in database
    const database = JSON.parse(fs.readFileSync("./database.json"));
    const indexOfUrl = database.indexOf(original_url);
    //if it exist gets id and SEND { original_url: original_url, short_url: id }
    if (indexOfUrl !== -1) {
      res.json({ original_url: "https://"+original_url, short_url: indexOfUrl });
    } else {
      //if it dosen't exist ADD it to database and SEND { original_url: original_url, short_url: id }
      database.push(original_url);
      res.json({ original_url: "https://"+original_url, short_url: database.length - 1 });
    }
    fs.writeFileSync("./database.json", JSON.stringify(database));
  } catch (error) {
    console.log(error)
    res.json({ error: "invalid url" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
