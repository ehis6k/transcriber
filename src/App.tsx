import { useState, useCallback } from 'react';
import { AudioUploader } from '@/components';
import { SUPPORTED_AUDIO_FORMATS } from '@/utils';
import type { AudioFile } from '@/models';
import './App.css';

function App() {
  const [message] = useState('Welcome to Transcriber');
  const [uploadedFiles, setUploadedFiles] = useState<AudioFile[]>([]);

  const handleFilesUploaded = useCallback((files: AudioFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Transcriber</h1>
        <p>Local-first audio transcription and summarization</p>
        <p className="supported-formats">
          Supports: {SUPPORTED_AUDIO_FORMATS.join(', ').toUpperCase()}
        </p>
      </header>

      <main className="app-main">
        <div className="status-message">
          <p>{message}</p>
          {uploadedFiles.length > 0 && <p>{uploadedFiles.length} file(s) ready for processing</p>}
        </div>

        <AudioUploader onFilesUploaded={handleFilesUploaded} />

        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3>Uploaded Files</h3>
            <ul>
              {uploadedFiles.map(file => (
                <li key={file.id}>
                  <strong>{file.name}</strong> - {file.format.toUpperCase()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
