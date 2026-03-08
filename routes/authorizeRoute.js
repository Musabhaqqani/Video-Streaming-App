import B2 from "backblaze-b2";
import express from "express";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config();
const client = neon(process.env.DATABASE_URL);
const authorizeRoute = express.Router();

const b2 = new B2({
  applicationKeyId: process.env.APPLICATION_KEY_ID,
  applicationKey: process.env.APPLICATION_KEY,
});

authorizeRoute.get("/getSignedUrl", async (req, res) => {
  try {
    await b2.authorize();
    let result;
    try{
        result = await client`
          INSERT INTO videos (title, original_file_name, status)
          VALUES (${req.query.title}, ${req.query.filename}, 'pending')
          RETURNING id
        `;
    }
    catch(err){
        console.log("DB error ", err);
        return res.status(500).json({error: 'Failed to insert record into database'})
    }
    const response = await b2.getUploadUrl({
      bucketId: process.env.BUCKET_ID,
    });
    const { uploadUrl, authorizationToken } = response.data;

    res.json({
      uploadUrl: uploadUrl,
      authorizationToken: authorizationToken,
      videoId: result[0].id,
    });

  } catch(err) {
    console.log(err);
    res.status(500).json({ error: "Failed to generate upload credentials" });
  }
});

authorizeRoute.post("/updateVideoStatus", async (req, res)=> {
    try{
        await client`update videos
        set status = 'processing'
        where id=${req.query.videoId}`;
        res.status(200).json({success: "Status changed to processing"});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to change status"});
    }
})

export default authorizeRoute;
