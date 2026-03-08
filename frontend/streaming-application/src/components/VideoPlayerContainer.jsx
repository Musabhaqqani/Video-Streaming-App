import React from "react";
import VideoPlayer from "./videoPlayer";
import videojs from "video.js";

const VideoPlayerContainer = () => {
  const playerRef = React.useRef(null);

  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        // Todo: the src is to be taken from the backend api
        src: "http://localhost:8000/uploads/videos/cfc52efa-8db2-4d3d-8456-e7a680006e2d/master.m3u8",
        type: "application/x-mpegURL",
      },
    ],
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;
    // You can handle player events here, for example:
    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
  };
  return <VideoPlayer options={videoJsOptions} onReady={handlePlayerReady} />;
};

export default VideoPlayerContainer;
