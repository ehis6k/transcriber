import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("Welcome to Transcriber");

  return (
    <div className="app">
      <header className="app-header">
        <h1>Transcriber</h1>
        <p>Local-first audio transcription and summarization</p>
      </header>
      
      <main className="app-main">
        <div className="status-message">
          <p>{message}</p>
        </div>
        
        <div className="upload-area">
          <div className="upload-placeholder">
            <p>Drop audio files here or click to browse</p>
            <p>Supported formats: WAV, MP3, M4A</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;