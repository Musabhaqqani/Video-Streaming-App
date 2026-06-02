import { Queue } from "bullmq";
import IORedis from 'ioredis';
import dotenv from "dotenv";

dotenv.config();
const redisConnection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

export const transcodingQueue = new Queue("video-transcoding", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, 
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true, 
    removeOnFail: false,   
  },
})