import B2 from "backblaze-b2";
import express from "express";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import axios from "axios";

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
    try {
      result = await client`
          INSERT INTO videos (title, original_file_name, status)
          VALUES (${req.query.title}, ${req.query.filename}, 'pending')
          RETURNING id
        `;
    } catch (err) {
      console.log("DB error ", err);
      return res
        .status(500)
        .json({ error: "Failed to insert record into database" });
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
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to generate upload credentials" });
  }
});

authorizeRoute.post("/updateVideoStatus", async (req, res) => {
  try {
    const response = await client`update videos
        set status = ${req.query.status}
        where id=${req.query.videoId}
        RETURNING id, original_file_name`;
    console.log(`Video ${req.query.videoId} is now ${req.query.status}`);
    res.status(200).json({ success: "Status updated" });
    triggerTranscoding(response[0].id, response[0].original_file_name);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to change status" });
  }
});

const triggerTranscoding = async (videoId, filename) => {
  const owner = "Musabhaqqani";
  const repo = "Video-Streaming-App";
  const token = process.env.GITHUB_TOKEN;
  try {
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/dispatches`,
      {
        event_type: "start_transcode", // Matches the 'types' in your YAML
        client_payload: {
          videoId: videoId,
          filename: filename,
          bucketId: process.env.BUCKET_ID,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );
    console.log("GitHub Action Triggered!");
  } catch (err) {
    console.error("Webhook Failed:", err.response?.data || err.message);
  }
};

authorizeRoute.get("/getStreamUrl/:videoId", async (req, res) => {
  const { videoId } = req.params;
  try {
    await b2.authorize();
    const authReponse = await b2.getDownloadAuthorization({
      bucketId: process.env.BUCKET_ID,
      fileNamePrefix: `videos/${videoId}/`,
      validDurationInSeconds: 3600
    });
    const token = authReponse.data.authorizationToken;
    const masterUrl = `https://f005.backblazeb2.com/file/${process.env.BUCKET_NAME}/videos/${videoId}/master.m3u8?Authorization=${token}`;
    res.json({ streamUrl: masterUrl });
  } catch {
    res.status(500).json({ error: "Could not generate stream URL" });
  }
});

authorizeRoute.get("/video-status/:id", async (req, res) => {
  try {
    const video = await client`
      SELECT status FROM videos WHERE id = ${req.params.id}
    `;
    if (video.length > 0) {
      res.json({ status: video[0].status });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

export default authorizeRoute;


// b2 bucket update vod-application allPrivate --cors-rules "$(cat corsRules.json)"
