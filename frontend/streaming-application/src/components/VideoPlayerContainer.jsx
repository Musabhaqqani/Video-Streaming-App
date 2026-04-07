import React, { useMemo } from "react";
import VideoPlayer from "./videoPlayer";
import videojs from "video.js";
import { useEffect } from "react";
import { useState } from "react";

const VideoPlayerContainer = ({ src }) => {
  const playerRef = React.useRef(null);
  useEffect(() => {
    console.log(src, 'loaded')
    // if (Array.isArray(src) && src.length > 0) {
    //   // Find the first valid URL with a token
    //   const validSrc = src.find((url) => {
    //     try {
    //       const urlObj = new URL(url);
    //       return urlObj.searchParams.has("Authorization");
    //     } catch {
    //       return false; // Skip invalid URLs
    //     }
    //   });

    //   if (validSrc) {
        try {
          const urlObj = new URL(src);
          const token = urlObj.searchParams.get("Authorization");

          if (token) {
            // Global interceptor: Append token to Backblaze requests
            videojs.Vhs.xhr.beforeRequest = (options) => {
              if (options.uri.includes("backblazeb2.com")) {
                const uri = new URL(options.uri);
                uri.searchParams.set("Authorization", token);
                options.uri = uri.toString();
              }
              return options;
            };
          }
        } catch (e) {
          console.error("Error parsing first valid src for token", e);
        }
      // } else {
      //   console.warn("No valid src with Authorization token found in array");
      // }
    // }
  }, [src]);

  // const videoJsOptions = useMemo(
  //   () => ({
  //     autoplay: false,
  //     controls: true,
  //     responsive: true,
  //     fluid: true,
  //     sources: Array.isArray(src)
  //       ? src.map((sourceUrl) => ({
  //           src: sourceUrl,
  //           type: "application/x-mpegURL",
  //         }))
  //       : [],
  //   }),
  //   [src],
  // );

  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
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

  return (
    <VideoPlayer
      options={videoJsOptions}
      onReady={handlePlayerReady}
      src={src}
    />
  );
};

export default VideoPlayerContainer;
