const express = require('express');
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, Collection, ObjectId } = require('mongodb');
require('dotenv').config()
// const stripe = require('stripe')
// const jwt = require('jsonwebtoken');

// middleware
app.use(cors())
app.use(express.static("public"))
app.use(express.json())


// uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zmpua4z.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // awaitclient.connect();

   // db and Collection
   const userCollection = client.db('GemArk').collection('users')
   const classCollection = client.db('GemArk').collection('products')
   const selectedClassCollection = client.db('GemArk').collection('myCart')
   const enrolledClassCollection = client.db('GemArk').collection('myProduct')
   const paymentCollection = client.db('GemArk').collection('payment')



    // -----END-----

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Knowledge want to learn')
})

// Start the server
app.listen(port, () => {
  console.log(`Server listening by me at port ${port}`);
});