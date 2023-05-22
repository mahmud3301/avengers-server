const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT || 7000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ofv9qpy.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri);

async function run() {
  try {
    const imageGallery = client.db("imageGalleryData").collection("imagesData");

    app.get("/image-gallery", async (req, res) => {
      const result = await imageGallery.find({}).toArray();
      res.send(result);
    });

    const toysData = client.db("toysCollectionsData").collection("toysData");

    app.get("/toys-data", async (req, res) => {
      const result = await toysData.find({}).toArray();
      res.send(result);
    });

    const allToysData = client
      .db("allToysCollectionsData")
      .collection("allToysData");

    app.get("/all-toys-data", async (req, res) => {
      const result = await allToysData.find({}).toArray();
      res.send(result);
    });

    app.post("/all-toys-data", async (req, res) => {
      const newToysData = req.body;
      const result = await allToysData.insertOne(newToysData);
      res.send(result);
    });

    const indexKeys = { toyName: 1 };
    const options = {
      sort: indexKeys,
    };
    const result = await allToysData.createIndex(indexKeys, options);
    app.get("/all-toys-data/:text", async (req, res) => {
      const text = req.params.text;
      const result = await allToysData
        .find({
          $or: [
            {
              toyName: { $regex: text, $options: "i" },
            },
          ],
        })
        .toArray();
      res.send(result);
    });

    app.get("/my-toys/:email", async (req, res) => {
      const email = req.params.email;
      const sort = req.query.sort === "desc" ? -1 : 1;
      const result = await allToysData
        .find({ sellerEmail: req.params.email })
        .sort({ price: sort })
        .toArray();
      res.send(result);
    });

    app.get("/my-toys/:email/:id", async (req, res) => {
      const email = req.params.email;
      const id = req.params.id;
      const result = await allToysData.findOne({
        sellerEmail: email,
        _id: ObjectId(id),
      });
      if (result) {
        res.send(result);
      } else {
        res.status(404).send("Toy not found");
      }
    });

    app.put("/my-toys/:id", async (req, res) => {
      const id = req.params.id;
      // const email = req.params.email;
      const updatedToy = req.body;
      const toysUpdate = {
        $set: {
            price: updatedToy.price,
            quantity : updatedToy.quantity,
            description: updatedToy.description,
        }
      }
      const result = await allToysData.updateOne(
        { _id: new ObjectId(id) },
        toysUpdate
      );
      res.send(result);
    });

    app.delete("/my-toys/:email", async (req, res) => {
      const email = req.params.email;
      const result = await allToysData.deleteOne({
        sellerEmail: req.params.email,
      });
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Avengers!!!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
