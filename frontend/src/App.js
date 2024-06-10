import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Form,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAudio } from "@fortawesome/free-solid-svg-icons";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (!token) {
      fetchToken();
    } else {
      fetchFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchToken = async () => {
    try {
      const response = await axios.post("https://secure-audio-app.onrender.com/token", {
        username: "username",
        password: "password",
      });
      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);
      setError("");
    } catch (error) {
      setError(
        "Error fetching token: " +
          (error.response ? error.response.data.msg : error.message)
      );
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await axios.get("https://secure-audio-app.onrender.com/files", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFiles(response.data);
      setError("");
    } catch (error) {
      setError(
        "Error fetching files: " +
          (error.response ? error.response.data.msg : error.message)
      );
    }
  };

  const handleFileClick = async (fileName) => {
    try {
      const response = await fetch(`https://secure-audio-app.onrender.com/files/${fileName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setError("");
    } catch (error) {
      setError("Error playing file: " + error.message);
    }
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await axios.post("https://secure-audio-app.onrender.com/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      fetchFiles();
      setSelectedFile(null);
      setError("");
    } catch (error) {
      setError(
        "Error uploading file: " +
          (error.response ? error.response.data.msg : error.message)
      );
    }
  };

  return (
    <Container>
      <h1>音声ファイル一覧</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleFileUpload}>
        <Form.Group>
          <Form.Control
            id="fileUpload"
            label="Upload an audio file"
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            custom="true"
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Upload
        </Button>
      </Form>
      <Row>
        {files.map((file, index) => (
          <Col key={index} md={4} className="mb-3">
            <Card>
              <Card.Body>
                <Card.Title>
                  <FontAwesomeIcon icon={faFileAudio} /> {file.title}
                </Card.Title>
                <Button
                  onClick={() => handleFileClick(file.name)}
                  variant="primary"
                >
                  再生
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {audioUrl && <audio src={audioUrl} controls autoPlay />}
    </Container>
  );
}

export default App;
