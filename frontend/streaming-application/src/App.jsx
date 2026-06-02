import React, { useEffect, useState } from "react";
import Upload from "./components/Upload";
import VideoPlayerContainer from "./components/VideoPlayerContainer";

function App() {
  const [src, setSrc] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    getUploadedVideos();
  }, []);

  const getUploadedVideos = async () => {
    try {
      setIsLoading(true);
      const uploadRes = await fetch("api/v1/getDashboardData", {
        method: "GET",
      });
      const response = await uploadRes.json();
      const urls = response.map((item) => item.streamUrl);
      setSrc(urls);
      setIsLoading(false);
    } catch {
      console.error("Unable to get dashboard data");
    }
  };

  if (isLoading) return <div className="text-white">Loading videos…</div>;
  return (
    <div>
      <Upload />
      {src &&
        src.map((url) => (
          <div key={url} style={{ width: "25rem" }}>
            <VideoPlayerContainer src={url} />
          </div>
        ))}
    </div>
  );
}

export default App;
