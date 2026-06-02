import { transcodingQueue } from "./transcodingQueue.js";

export const recoverOrphanedJobs = async (client) => {
  try {
    console.log("Checking database for stuck or orphaned processing jobs...");
    const stuckVideos = await client`
      SELECT id, original_file_name 
      FROM videos 
      WHERE status = 'processing'
    `;

    if (stuckVideos.length === 0) {
      console.log("No stuck jobs found. System is clean.");
      return;
    }

    console.log(
      `Found ${stuckVideos.length} stuck jobs. Re-queuing them now...`,
    );

    for (const video of stuckVideos) {
      const jobId = `recovery-${video.id}`;
      const existingJob = await transcodingQueue.getJob(jobId);

      if (existingJob) {
        console.log(
          `Job ${jobId} found sitting in Redis cache. Evicting old state...`,
        );
        await existingJob.remove();
      }

      await transcodingQueue.add(
        "github-dispatch-action",
        {
          videoId: video.id,
          filename: video.original_file_name,
        },
        {
          jobId: `recovery-${video.id}`,
        },
      );
      console.log(
        `Re-queued Video ID: ${video.id} (${video.original_file_name})`,
      );
    }

    console.log("Recovery check complete.");
  } catch (err) {
    console.error("Failed to run job recovery on startup:", err);
  }
};
