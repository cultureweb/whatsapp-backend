import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Cors from "cors";
import Messages from "./dbMessages.js";

// app config
const app = express();
dotenv.config();
const PORT = process.env.PORT || 47001;

// middleware
app.use(express.json());
app.use(Cors());

// DB config
const connection_url = process.env.ATLAS_URI || "mongodb://localhost/test-db";
mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

// api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/api/v1/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/api/v1/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(`New message created: \n ${data}`);
    }
  });
});

// Listen
app.listen(PORT, () => console.log(`listening on localhost: ${PORT}`));
