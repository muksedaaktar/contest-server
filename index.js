const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());


const uri = "mongodb+srv://contestdbUser:C7DNZBxKGpJNifsb@contesthubcluster.tjeey7t.mongodb.net/?appName=ContestHubCluster";


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


app.get('/', (req,res) => {
    res.send('Contest server is running.')
})


async function run (){

    try{
        await client.connect();

        const db = client.db('contest_db');
        const contestsCollection = db.collection('contests');


        app.get('/contests', async(req, res) => {
            const cursor = contestsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        app.get('/contests/:id', async(req,res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await contestsCollection.findOne(query);
            res.send(result);


        })

        app.post('/contests', async(req,res) => {
            const newContest = req.body;
            const result = await contestsCollection.insertOne(newContest);
            res.send(result);
        })


        app.patch('/contests/:id', async(req, res) =>{
            const id = req.params.id;
            const updatedContest = req.body;
            const query = {_id: new ObjectId(id)}
            const update = {
                $set: updatedContest
                //  {
                //     name: updatedContest.name,
                //     type: updatedContest.type
                // }
            }

            const result = await contestsCollection.updateOne(query,update);
            res.send(result);
        })


        app.delete('/contests/:id', async(req,res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await contestsCollection.deleteOne(query);
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
         console.log("Pinged your deployment. You successfully connected to MongoDB!");

    }

    finally{

    }

}
run ().catch(console.dir)


app.listen(port, () => {
    console.log(`Contest server is running on port:${port}`)
})