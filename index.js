const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
require('dotenv').config()

// middleware
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('handy plus server is running!')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7wku5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);
async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db('handyPlus').collection('tools');
        const ordersCollection = client.db('handyPlus').collection('orders')
        const reviwesCollection = client.db('handyPlus').collection('reviews')
        const profilesCollection = client.db('handyPlus').collection('profiles')
        app.get('/tools', async (req, res) => {
            const query = {};
            const result = await toolsCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            console.log(query);
            const result = await toolsCollection.findOne(query);

            res.send(result)
        })
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order)
            res.send(result);
        })
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            console.log('email', email);
            const filter = { email: email }
            const result = await ordersCollection.find(filter).toArray();
            res.send(result)

        })
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(query);
            res.send(result)
        })
        app.get('/reviews', async (req, res) => {
            const query = {};
            const result = await reviwesCollection.find(query).toArray()
            res.send(result);
        })
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviwesCollection.insertOne(review)
            res.send(result)
        })
        app.put('/profile/:email', async (req, res) => {

            const email = req.params.email;
            const options = { upsert: true };
            const filter = { email: email };
            const doc = req.body;
            const updateDoc = {
                $set: doc
            };
            const result = await profilesCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

    }
    finally {
        // await client.close();
    }
}

// call run function

run().catch(console.dir);


app.listen(port, () => {
    console.log(`Handy plus on port ${port}`)
})