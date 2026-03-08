import React from "react";

const Upload = () => {
  const handleVideoUpload = () => {
    const input = document.getElementById("video-picker");
    const file = input.files[0];
    uploadFileToBucket(file);
  };

  const updateVideoStatus = async(videoId) => {
    const response = await fetch(`/api/v1/updateVideoStatus?videoId=${videoId}`,{
      method: 'POST'}
    );
    const data = await response.json();
    console.log(data);
  }

  const uploadFileToBucket = async (file) => {
    const response = await fetch(
      "/api/v1/getSignedUrl?title=demo&filename=out.mp4",
    );
    const { uploadUrl, authorizationToken, videoId } = await response.json();

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: authorizationToken,
        "X-Bz-File-Name": encodeURIComponent(`${videoId}-${file.name}`),
        "Content-Type": file.type || "b2/x-auto",
        "X-Bz-Content-Sha1": "do_not_verify",
      },
      body: file
    });
    if(uploadRes.ok){
      console.log("uploaded, have to transcode");
      //trigger backend service to update status of the file

      updateVideoStatus(videoId);
    }
  };
  return (
    <div>
      <input
        type="file"
        id="video-picker"
        accept="video/mp4,video/x-m4v,video/*"
        onChange={handleVideoUpload}
      />
    </div>
  );
};

export default Upload;
