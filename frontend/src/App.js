// frontend/src/App.js

import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [token, setToken] = useState(null);
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // Example login request to get JWT token
    axios
      .post("http://localhost:5000/login", {
        username: "user",
        password: "password",
      })
      .then((response) => {
        setToken(response.data.access_token);
      })
      .catch((error) => {
        console.error("Error logging in:", error);
      });
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file || !token) return;

    const formData = new FormData();
    formData.append("file", file);

    axios
      .post("http://localhost:5000/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log("File uploaded:", response.data);
        fetchFiles();
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });
  };

  const fetchFiles = () => {
    axios
      .get("http://localhost:5000/files", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setFiles(response.data);
      })
      .catch((error) => {
        console.error("Error fetching files:", error);
      });
  };

  return (
    <div>
      <h1>File Upload</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <h2>Uploaded Files</h2>
      <ul>
        {files.map((file, index) => (
          <li key={index}>{file}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
