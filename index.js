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


app.get('/', (req, res) => {
    res.send('Contest server is running.')
})


async function run() {

    try {
        await client.connect();

        const db = client.db('contest_db');
        const contestsCollection = db.collection('contests');
        const winnersCollection = db.collection('winners');

        //Prticipants increase APIs
        app.patch("/contests/increase/:id", async (req, res) => {
            const id = req.params.id;

            const result = await contestsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $inc: { participants: 1 } }
            );

            res.send(result);
        });

        //winners APIs

        app.get("/winners", async (req, res) => {
            const result = await winnersCollection.find().toArray();
            res.send(result);
        });


        app.get("/winners/:id", async (req, res) => {

            const id = req.params.id;

            const result = await winnersCollection.findOne({
                contestId: id,
            });

            res.send(result);

        });


        app.post("/winners", async (req, res) => {
            try {
                const {
                    contestId,
                    winner_name,
                    winner_image,
                    prize,
                } = req.body;

                const winner = {
                    contestId,
                    winner_name,
                    winner_image,
                    prize,
                    declaredAt: new Date(),
                };

                const result = await winnersCollection.insertOne(winner);

                // update contest collection
                await contestsCollection.updateOne(
                    { _id: new ObjectId(contestId) },
                    {
                        $set: {
                            status: "ended",
                            winnerDeclared: true,
                        },
                    }
                );

                res.send({
                    success: true,
                    message: "Winner declared successfully",
                    data: result,
                });
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        //popular contest APIs
        app.get('/popular-contests', async (req, res) => {
            const cursor = contestsCollection.find().sort({ participants: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })


        //Contests APIs
        app.get("/contests", async (req, res) => {
            console.log(req.query);

            const { email, type } = req.query;

            const query = {};

            // filter by creator email
            if (email) {
                query.creator_email = email;
            }

            // filter by contest type (search feature)
            if (type) {
                query.type = { $regex: type, $options: "i" };
            }

            const result = await contestsCollection.find(query).toArray();
            res.send(result);
        });


        app.get('/contests/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await contestsCollection.findOne(query);
            res.send(result);


        })


        app.post('/contests', async (req, res) => {
            const newContest = req.body;
            const result = await contestsCollection.insertOne(newContest);
            res.send(result);
        })


        app.patch('/contests/:id', async (req, res) => {
            const id = req.params.id;
            const updatedContest = req.body;
            const query = { _id: new ObjectId(id) }
            const update = {
                $set: updatedContest
                //  {
                //     name: updatedContest.name,
                //     type: updatedContest.type
                // }
            }

            const result = await contestsCollection.updateOne(query, update);
            res.send(result);
        })


        app.delete('/contests/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await contestsCollection.deleteOne(query);
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    }

    finally {

    }

}
run().catch(console.dir)


app.listen(port, () => {
    console.log(`Contest server is running on port:${port}`)
})