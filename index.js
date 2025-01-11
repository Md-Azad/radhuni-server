const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 3000;

// middlewares

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cn37c5v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollecton = client.db("radhuniDB").collection("menu");
    const userCollecton = client.db("radhuniDB").collection("users");
    const reviewCollecton = client.db("radhuniDB").collection("reviews");
    const cartCollecton = client.db("radhuniDB").collection("carts");

    // middlewares

    const verifytoken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const result = await userCollecton.findOne(query);
      const isAdmin = result?.role === "admin";

      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // JWT RELATED API

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // users api
    app.get("/users", verifytoken, verifyAdmin, async (req, res) => {
      const result = await userCollecton.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", verifytoken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(401).send({ message: "Forbidden access" });
      }
      let isAdmin = false;
      const query = { email: email };
      const result = await userCollecton.findOne(query);
      if (result) {
        isAdmin = result?.role === "admin";
      }

      res.send({ isAdmin });
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const email = user.email;
      const query = { email: email };
      const isExistUser = await userCollecton.findOne(query);
      if (isExistUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await userCollecton.insertOne(user);
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollecton.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };

      const result = await userCollecton.deleteOne(filter);
      res.send(result);
    });

    // menu api

    app.post("/menu", verifytoken, verifyAdmin, async (req, res) => {
      const item = req.body;
      console.log("this api called", item);
      const result = await menuCollecton.insertOne(item);
      res.send(result);
    });
    app.get("/menu", async (req, res) => {
      const result = await menuCollecton.find().toArray();
      res.send(result);
    });
    app.get("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollecton.findOne(query);
      res.send(result);
    });

    app.delete("/menu/:id", verifytoken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollecton.deleteOne(query);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewCollecton.find().toArray();
      res.send(result);
    });

    // cart apis

    app.get("/carts", async (req, res) => {
      const email = req.query.email;

      const query = { userEmail: email };
      const result = await cartCollecton.find(query).toArray();

      res.send(result);
    });
    app.post("/carts", async (req, res) => {
      const cartData = req.body;
      const result = await cartCollecton.insertOne(cartData);
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await cartCollecton.deleteOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("radhuni server is running");
});

app.listen(port, () => {
  console.log(`this serser is running on port: "http://localhost:${port}`);
});
