const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

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
        // await client.connect();

        const db = client.db('contest_db');
        const contestsCollection = db.collection('contests');
        const winnersCollection = db.collection('winners');
        const submissionsCollection = db.collection('submissions');
        const registrationsCollection = db.collection('registrations');
        const usersCollection = db.collection('users');


        //users APIs
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result);
        });


        app.post("/users", async (req, res) => {
            const user = req.body;

            const query = { email: user.email };

            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: "User already exists" });
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        app.patch("/users/:email", async (req, res) => {
            const email = req.params.email;
            const update = req.body;

            const result = await usersCollection.updateOne(
                { email },
                { $set: update },
                { upsert: true }
            );

            res.send(result);
        });

        app.get("/users/stats/:email", async (req, res) => {
            const email = req.params.email;

            const participated = await registrationsCollection.countDocuments({
                userEmail: email
            });

            const won = await winnersCollection.countDocuments({
                winner_email: email
            });

            const winPercentage =
                participated === 0 ? 0 : (won / participated) * 100;

            res.send({
                participated,
                won,
                winPercentage
            });
        });

        //contests registration APIs
        app.post("/registrations", async (req, res) => {
            const data = req.body;
            const result = await registrationsCollection.insertOne(data);
            res.send(result);
        });

        app.get("/registrations", async (req, res) => {
            const { email, contestId } = req.query;

            const query = {};

            if (email) {
                query.userEmail = email;
            }

            if (contestId) {
                query.contestId = contestId;
            }

            const result = await registrationsCollection.find(query).toArray();

            res.send(result);
        });

        //Prticipants increase APIs
        app.patch("/contests/increase/:id", async (req, res) => {
            const id = req.params.id;

            const result = await contestsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $inc: { participants: 1 } }
            );

            res.send(result);
        });

        //Submission task
        app.post("/submissions", async (req, res) => {
            const result = await submissionsCollection.insertOne(req.body);
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
                    winner_email,
                    prize,
                } = req.body;

                const winner = {
                    contestId,
                    winner_name,
                    winner_image,
                    winner_email,
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


        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");

    }

    finally {

    }

}
run().catch(console.dir)


app.listen(port, () => {
    console.log(`Contest server is running on port:${port}`)
})