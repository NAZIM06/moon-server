const express = require('express');
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, Collection, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require('stripe')
const jwt = require('jsonwebtoken');

// middleware
app.use(cors())
app.use(express.static("public"))
app.use(express.json())


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'Unauthorize Access' })
  }
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      console.log(error)
      return res.send({ error: true, message: 'Unauthorize Access' })
    }
    req.decoded = decoded;
    next()
  })
}

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
   const productCollection = client.db('GemArk').collection('products')
   const selectedProductCollection = client.db('GemArk').collection('myCart')
   const myProductCollection = client.db('GemArk').collection('myProduct')
   const paymentCollection = client.db('GemArk').collection('payment')

   // JWT
   app.post('/jwt', (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1h' })
    res.send({ token })
  })


  //product api
  app.post('/all-classes', async (req, res) => {
    const classes = req.body
    const result = await productCollection.insertOne(classes)
    res.send(result)
  })
  app.post('/selected-class', async (req, res) => {
    const selectedClass = req.body;
    const result = await selectedProductCollection.insertOne(selectedClass)
    res.send(result)
  })
  app.get('/selected-classes', verifyJWT, async (req, res) => {
    const email = req.query.email;
    const query = { studentEmail: email }
    const result = await selectedProductCollection.find(query).toArray()
    res.send(result)
  })
  app.get('/selected-class/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await selectedProductCollection.findOne(query)
    res.send(result)
  })
  app.delete('/selected-classes/:id', verifyJWT, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await selectedProductCollection.deleteOne(query)
    res.send(result)
  })
  app.get('/approved-all-classes', async (req, res) => {
    const query = { status: 'Approved' } //only shows the approved classes
    const result = await productCollection.find(query).toArray()
    res.send(result)
  })
  app.get('/all-classes',verifyJWT,  async (req, res) => {
    const result = await productCollection.find().sort({date : -1}).toArray()
    res.send(result)
})
  app.get('/all-classes/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;
    const query = { instructorEmail: email }
    const result = await productCollection.find(query).toArray()
    res.send(result)
  })
  app.put('/all-classes/:id', async (req, res) => {
    const id = req.params.id;
    const status = req.query.status;
    const feedback = req.query.feedback;
    if (status == 'approved') {
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          status: 'Approved'
        }
      }
      const result = await productCollection.updateOne(query, updatedDoc)
      res.send(result)
    }
    if (status == 'denied') {
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          status: 'Denied'
        }
      }
      const result = await productCollection.updateOne(query, updatedDoc)
      res.send(result)
    }
    if (feedback) {
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          feedback: feedback
        }
      }
      const result = await productCollection.updateOne(query, updatedDoc)
      res.send(result)
    }
  })
  app.get('/popular-classes', async (req, res) => {
    const query = { status: 'Approved' }
    const result = await productCollection.find(query).sort({ enrolledStudents: -1 }).toArray()
    res.send(result)
  })
  app.get('/enrolled-classes/:email', verifyJWT, async (req, res) => {
    const email = req.params.email
    const query = { studentEmail: email }
    const result = await myProductCollection.find(query).toArray()
    res.send(result)
  })

  //users api
  app.post('/all-users', async (req, res) => {
    const user = req.body;
    const query = { email: user?.email }
    const existingUser = await userCollection.findOne(query);
    if (existingUser) {
      return res.send({})
    }
    const result = await userCollection.insertOne(user)
    res.send(result)
  })
  app.get('/user/admin/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;
    const query = { email: email, role: 'admin' }
    console.log(email)
    const admin = await userCollection.findOne(query)
    res.send(admin)
  })
  app.get('/user/instructor/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;
    const query = { email: email, role: 'instructor' }
    const instructor = await userCollection.findOne(query)
    res.send(instructor)
  })
  app.get('/user/student/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;
    const query = { email: email, role: 'student' }
    const student = await userCollection.findOne(query)
    res.send(student)
  })
  app.get('/current-user', async (req, res) => {
    const email = req.query.email;
    const query = { email: email }
    const result = await userCollection.findOne(query)
    res.send(result)
  })
  app.get('/all-users', verifyJWT, async (req, res) => {
    const result = await userCollection.find().toArray()
    res.send(result)
  })
  app.get('/all-instructors', async (req, res) => {
    const query = { role: 'instructor' }
    const result = await userCollection.find(query).toArray()
    res.send(result)
  })
  app.put('/all-users/:id', verifyJWT, async (req, res) => {
    const id = req.params.id;
    const role = req.query.role;
    const query = { _id: new ObjectId(id) }
    const updatedDoc = {
      $set: {
        role: role
      }
    }
    const result = await userCollection.updateOne(query, updatedDoc)
    res.send(result)
  })
  
  app.get('/popular-instructors', async (req, res) => {
    const query = { role: 'instructor' }
    const result = await userCollection.find(query).toArray()
    res.send(result)
  })

   //payment api
   app.post("/create-payment-intent", async (req, res) => {
    const { price } = req.body;
    const amount = Math.round(price * 100);
    const stripeClient = stripe(process.env.STRIPE_KEY);
    try {
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: amount,
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "An error occurred while creating the PaymentIntent." });
    }
});
app.post('/payment',verifyJWT, async (req, res) => {
    const payment = req.body;
    const insertResult = await paymentCollection.insertOne(payment);

    const enrolledQuery = { studentEmail: payment.email, classId: payment.classId }
    const enrolledClass =  await selectedProductCollection.findOne(enrolledQuery)
    const enrolledInsertResult = await myProductCollection.insertOne(enrolledClass)

    const enrolledDeleteResult = await selectedProductCollection.deleteOne(enrolledQuery)

    const classQuery = { _id: new ObjectId(payment.classId) };
    const classDocument = await productCollection.findOne(classQuery); // Fetch the latest document

    if (classDocument && classDocument.seats > 0) {
        const updatedSeats = classDocument.seats - 1;
        const updateEnrolledStudents = classDocument.enrolledStudents + 1;
        const updateResult = await productCollection.updateOne(
            classQuery,
            { $set: { seats: updatedSeats, enrolledStudents : updateEnrolledStudents } }
        );

        res.send({ insertResult, updateResult, enrolledDeleteResult, enrolledInsertResult });
    }
});
app.get('/payment-history',verifyJWT, async (req, res) => {
    const email = req.query.email;
    const query = {email : email}
    const result = await paymentCollection.find(query).sort({date : -1}).toArray()
    res.send(result)
})

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