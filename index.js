const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
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
    const reviewCollecton = client.db("radhuniDB").collection("reviews");
    const cartCollecton = client.db("radhuniDB").collection("carts");

    app.get("/menu", async (req, res) => {
      const result = await menuCollecton.find().toArray();
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
      console.log(id);
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
