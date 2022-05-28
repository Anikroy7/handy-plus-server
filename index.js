const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('handy plus server is running!')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7wku5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);
function verifyJwt(req, res, next) {

    const auth = req.headers.authorization;
    console.log('from jwt again', auth);
    if (!auth) {
        return res.status(401).send({ message: 'Unauthorized accsess' });
    }
    const accsessToken = auth.split(' ')[1]

    jwt.verify(accsessToken, process.env.SECRET_ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden accsess' })
        }
        req.decoded = decoded;
        console.log('from decoded', decoded);
        next()
    });

}
async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db('handyPlus').collection('tools');
        const ordersCollection = client.db('handyPlus').collection('orders')
        const reviwesCollection = client.db('handyPlus').collection('reviews')
        const profilesCollection = client.db('handyPlus').collection('profiles')
        const userCollection = client.db('handyPlus').collection('users')



        const verifyAdmin = async (req, res, next) => {
            const requester = req?.decoded?.email;
            const requesterAccount = await userCollection.findOne({ email: requester })
            if (requesterAccount.role === 'admin') {
                next()
            }
            else {
                return res.status(403).send({ message: 'Forbidden accsess' })
            }
        }

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const options = { upsert: true };
            const filter = { email: email };
            const doc = req.body;
            const updateDoc = {
                $set: doc
            };
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.SECRET_ACCESS_TOKEN, {
                expiresIn: '7d'
            })
            res.send({ result, token })

        })

        app.get('/user', async (req, res) => {
            const query = {};
            const result = await userCollection.find(query).toArray();
            res.send(result)
        })
        app.put('/user/admin/:email', verifyJwt, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const updateDoc = {
                $set: { role: 'admin' }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)

        })
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email })
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        app.post('/tools', async (req, res) => {
            const tools = req.body;
            const result = await toolsCollection.insertOne(tools)
            res.send(result);
        })

        app.get('/tools', async (req, res) => {
            const query = {};
            const result = await toolsCollection.find(query).toArray();
            res.send(result)
        })
        app.delete('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await toolsCollection.deleteOne(query);
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
        app.get('/orders', async (req, res) => {
            const query = {};
            const result = await ordersCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/orders/:email', verifyJwt, async (req, res) => {
            console.log('fromdecc', req.decoded)
            const email = req.params.email;
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail);
            if (email === decodedEmail) {

                const filter = { email: email }
                const result = await ordersCollection.find(filter).toArray();
                res.send(result)
            }
            else {
                return res.status(403).send({ message: 'Forbidden accsess' })
            }

        })
        app.get('/orders/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.findOne(query);
            res.send(result)
        })
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;

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
        app.get('/profile/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            console.log(email);
            const result = await profilesCollection.findOne(query)
            res.send({ result })

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