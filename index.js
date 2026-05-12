require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

const run = async () => {
    try {
        await client.connect();

        const db = client.db('wanderlust_db');
        const destinationCollection = db.collection('destinations');

        app.get('/destinations', async (req, res)=>{
            const result = await destinationCollection.find().toArray();
            res.send(result);
        })
        app.get('/destinations/:id', async (req, res)=>{
            const {id} = req.params;
            const result = await destinationCollection.findOne({_id: new ObjectId(id)});
            res.send(result);
        })

        app.post('/destinations', async (req, res) => {
            const doc = req.body;
            const result = destinationCollection.insertOne(doc);
            res.send(result);
        })

        // update destination
        app.patch('/destinations/:id', async (req, res)=>{
            const {id} = req.params;
            const updatedData = req.body;

            const result = destinationCollection.updateOne(
                {_id: new ObjectId(id)},
                {$set: updatedData}
            )
            console.log(result);
            res.send(result);
        })

        app.delete('/destinatiogitns/:id', async (req, res)=>{
            const {id} = req.params;
            const result = await destinationCollection.deleteOne({_id: new ObjectId(id)});
            res.send(result)
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
    res.send('Welcome from Home');
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})