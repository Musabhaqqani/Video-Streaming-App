import React from "react";
import VideoPlayer from "./videoPlayer";
import videojs from "video.js";
import { useEffect } from "react";
import { useState } from "react";

const VideoPlayerContainer = ({ status, videoId }) => {
  const playerRef = React.useRef(null);
  const [src, setSrc] = useState('https://f005.backblazeb2.com/file/vod-application/videos/b5eb7b29-b3d7-44aa-9943-05eebbfaa5f6/master.m3u8?Authorization=3_20260308155408_970a137003fc31473044ee9a_133f63e28c765295689d93673bc4ab64a67a7bc3_005_20260308165408_0044_dnld');

  // const fetchUrl = async() => {
  //   await fetch(`/api/v1/getStreamUrl/${videoId}`)
  //     .then(res => res.json())
  //     .then(data => setStreamUrl(data.streamUrl));
  // }

  useEffect(() => {
  if (src) {
    try {
      // 1. Parse your hardcoded URL
      const urlObj = new URL(src);
      const token = urlObj.searchParams.get("Authorization");

      if (token) {
        // 2. Global interceptor: This tells Video.js to "copy-paste" 
        // the token onto every segment request it makes in the background.
        videojs.Vhs.xhr.beforeRequest = (options) => {
          // Only append to Backblaze requests to avoid leaking tokens to other domains
          if (options.uri.includes("backblazeb2.com")) {
            const uri = new URL(options.uri);
            uri.searchParams.set("Authorization", token);
            options.uri = uri.toString();
          }
          return options;
        };
        console.log("Token interceptor attached for:", token);
      }
    } catch (e) {
      console.error("Invalid hardcoded URL", e);
    }
  }
}, [src]);

  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        // Todo: the src is to be taken from the backend api
        src: src,
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
