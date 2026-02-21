import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

const uploadRoute = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + uuidv4() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

uploadRoute.post("/upload", upload.single("file"), (req, res) => {
  const lessonId = uuidv4();
  //The video path will be the path where the video is uploaded
  //It can be S3 or any storage, suppose you give an S3, the videoPath must be the url from the S3 bucket
  const videoPath = req.file.path;
  const outputPath = `./uploads/videos/${lessonId}`;
  //HLS - HTTP Live Stream. The M3U8 is a utf-8 encoding which stores the file in a plain text as indexes for each timestamp
  //The voice and the video are stored separetly, this is how videos are streamed over the internet
  const hlsPath = `${outputPath}/index.m3u8`;
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;
  // This should be pushed and executed in a queue at real time, this implementation is not used in production for converting mp4 to hls format
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`exec error: ${error}`);
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    const videoUrl = `http://localhost:8000/uploads/videos/${lessonId}/index.m3u8`;

    res.json({
      message: "Video converted to HLS format",
      videoUrl: videoUrl,
      lessonId: lessonId,
    });
  });
});

export default uploadRoute;
