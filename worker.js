import dotenv from "dotenv";
import axios from "axios";
import IORedis from 'ioredis';
import { Worker } from "bullmq";

dotenv.config();
const redisConnection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
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
    throw new Error(err.response?.data?.message || err.message);
  }
};

const transcodeWorker = new Worker(
  "video-transcoding", 
  async (job) => {
    const { videoId, filename } = job.data;
    console.log(`[Worker] Processing job ${job.id} for Video: ${filename} (ID: ${videoId})`);

    await triggerTranscoding(videoId, filename);
  }, 
  {
    connection: redisConnection,
    concurrency: 2, 
  }
);

transcodeWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully!`);
});

transcodeWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});

export default transcodeWorker;