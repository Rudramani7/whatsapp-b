//importing
import  express  from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import  cors from "cors";

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1352583",
    key: "ce1ebaf7b747b07d4acf",
    secret: "04da0f090aab4b9850aa",
    cluster: "eu",
    useTLS: true
  });

  //middleware
app.use(express.json());
app.use(cors());

app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
});

//DB config
const connection_url = 'mongodb+srv://admin:admin123@cluster0.qvsr1.mongodb.net';

mongoose.connect(connection_url,{

});

const db = mongoose.connection;

db.once('open',()=>{
    console.log("DB Connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change",(change)=>{
        console.log("A change",change);

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name: messageDetails.name,
                message:messageDetails.message,
                timestamp:messageDetails.timestamp,
                received:messageDetails.received,
            });
        }else{
            console.log('Error triggering Pusher')
        }
    });
});


//api routes
app.get('/',(req,res)=>res.status(200).send('hello world'));

app.get('/messages/sync',(req, res)=>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    })
})

app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body;

    Messages.create(dbMessage,(err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        }
    });
});

app.listen(port,()=>console.log(`Listening on localhost:${port}`));