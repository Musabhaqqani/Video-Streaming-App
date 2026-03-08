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
  const hlsPath = `${outputPath}/master.m3u8`;
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  //Todo: Modify this command to create segments for 480, 720 and 1080p
 const ffmpegCommand = `ffmpeg -i ${videoPath} \
-map 0:v -map 0:a -c:v libx264 -c:a aac -s:v:0 1920x1080 -b:v:0 5000k \
-map 0:v -map 0:a -c:v libx264 -c:a aac -s:v:1 1280x720 -b:v:1 2800k \
-map 0:v -map 0:a -c:v libx264 -c:a aac -s:v:2 854x480 -b:v:2 1400k \
-var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
-master_pl_name ${outputPath}/master.m3u8 \
-f hls -hls_time 10 -hls_list_size 0 \
-hls_segment_filename "${outputPath}/v%v/file%03d.ts" ${outputPath}/v%v/index.m3u8`;
  // const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;
  // const transform = `ffmpeg -i input.mp4 \
  // -map 0:v -map 0:a -s:v:0 1920x1080 -b:v:0 5000k \
  // -map 0:v -map 0:a -s:v:1 1280x720  -b:v:1 2800k \
  // -map 0:v -map 0:a -s:v:2 640x360   -b:v:2 800k \
  // -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  // -master_pl_name master.m3u8 \
  // -f hls -hls_time 10 -hls_list_size 0 \
  // -hls_segment_filename "v%v/file%03d.ts" v%v/index.m3u8`;
  // This should be pushed and executed in a queue at real time, this implementation is not used in production for converting mp4 to hls format
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`exec error: ${error}`);
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    const videoUrl = `http://localhost:8000/uploads/videos/${lessonId}/master.m3u8`;

    // Todo: save into firebase/backend
    res.json({
      message: "Video converted to HLS format",
      videoUrl: videoUrl,
      lessonId: lessonId,
    });
  });
});

export default uploadRoute;
