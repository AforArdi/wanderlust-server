require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const app = express();
const port = process.env.PORT || 5000
const uri = process.env.MONGODB_URI

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const JWKS = createRemoteJWKSet(
    new URL('http://localhost:3000/api/auth/jwks')
)
// instead of writing verifyJwtToken in every route, we can use it as a middleware for all routes
const verifyJwtToken = async (req, res, next) => {
    const header = req?.headers.authorization;
    if(!header){
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = header?.split(' ')[1];
    if(!token){
        return res.status(401).send({ message: 'Unauthorized access' });
    }

    try{
        const {payload} = await jwtVerify(token, JWKS);
        // console.log(payload);
        next()
    }
    catch (error) {
        res.status(403).send({ message: 'Forbidden access' });
    }
}

const run = async () => {
    try {
        await client.connect();

        const db = client.db('wanderlust_db');
        const destinationCollection = db.collection('destinations');
        const bookingCollection = db.collection('bookings');

        app.get('/destinations', async (req, res) => {
            const result = await destinationCollection.find().toArray();
            res.send(result);
        })
        app.get('/destinations/:id', verifyJwtToken, async (req, res) => {
            const { id } = req.params;
            const result = await destinationCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        })

        app.post('/destinations', verifyJwtToken, async (req, res) => {
            const doc = req.body;
            const result = await destinationCollection.insertOne(doc);
            res.send(result);
        })

        // update destination
        app.patch('/destinations/:id', verifyJwtToken, async (req, res) => {
            const { id } = req.params;
            const updatedData = req.body;

            const result = await destinationCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            )
            res.send(result);
        })

        app.delete('/destinations/:id', verifyJwtToken, async (req, res) => {
            const { id } = req.params;
            const result = await destinationCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result)
        })

        // bookings
        app.get('/bookings/:userId', verifyJwtToken, async (req, res) => {
            const { userId } = req.params;
            const result = await bookingCollection.find({ userId: userId }).toArray();
            res.send(result);
        })

        app.post('/bookings', verifyJwtToken, async (req, res) => {
            const data = req.body;
            const result = await bookingCollection.insertOne(data);
            res.send(result);
        })

        app.delete('/bookings/:id', verifyJwtToken, async (req, res) => {
            const { id } = req.params;
            const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running fine....');
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})