import React, { useEffect, useState } from "react";
import Upload from "./components/Upload";
import VideoPlayerContainer from "./components/VideoPlayerContainer";

function App() {
  const [src, setSrc] = useState([]);
  useEffect(() => {
    getUploadedVideos();
  }, []);

  const getUploadedVideos = async () => {
    try {
      const uploadRes = await fetch("api/v1/getDashboardData", {
        method: "GET",
      });
      const response = await uploadRes.json();
      const urls = response.map((item) => item.streamUrl);
      setSrc(urls);
    } catch {
      console.error("Unable to get dashboard data");
    }
  };

  if (!src.length && src.length != 0) return <div>Loading videos…</div>;
  return (
    <>
      <Upload />
      {src &&
        src.map((url) => (
          <div key={url} style={{ width: "25rem" }}>
            <VideoPlayerContainer src={url} />
          </div>
        ))}
    </>
  );
}

export default App;
