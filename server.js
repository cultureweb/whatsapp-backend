import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Cors from "cors";
import Pusher from "pusher";
import Messages from "./dbMessages.js";
// const Pusher = require("pusher");

// app config
const app = express();
dotenv.config();
const PORT = process.env.PORT || 47001;
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "123456",
  key: process.env.PUSHER_KEY || "mykey",
  secret: process.env.PUSHER_SECRET || "secret",
  cluster: "eu",
  useTLS: true,
});

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

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB is connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A Change occured", change);

    if (change && change.operationType === "insert") {
      const messageDetails = change.fullDocument;

      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("error triggering Pusher");
    }
  });
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
