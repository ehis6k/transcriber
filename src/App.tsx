import { useCallback, useEffect, useState } from 'react';
import { AudioUploader, AudioPlayer, Navigation, HistoryView } from '@/components';
import { SUPPORTED_AUDIO_FORMATS, initializePlatform } from '@/utils';
import { AudioFilesProvider, useAudioFiles } from '@/contexts';
import type { AudioFile } from '@/models';
import './App.css';

function AppContent() {
  const { state, addFiles, removeFile, clearFiles } = useAudioFiles();
  const { files: uploadedFiles } = state;
  const [currentView, setCurrentView] = useState<'transcription' | 'history'>('transcription');
  const message = 'Welcome to Transcriber';

  // Initialize platform detection on app start
  useEffect(() => {
    initializePlatform()
      .then(platformInfo => {
        console.log('Platform initialized:', platformInfo);
      })
      .catch(error => {
        console.warn('Failed to initialize platform:', error);
      });
  }, []);

  const handleFilesUploaded = useCallback(
    (files: AudioFile[]) => {
      addFiles(files);
    },
    [addFiles]
  );

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
        <Navigation 
          currentView={currentView} 
          onViewChange={setCurrentView} 
        />

        {currentView === 'transcription' ? (
          <>
            <div className="status-message">
              <p>{message}</p>
              {uploadedFiles.length > 0 && <p>{uploadedFiles.length} file(s) ready for processing</p>}
            </div>

            <AudioUploader onFilesUploaded={handleFilesUploaded} />

            {uploadedFiles.length > 0 && (
              <div className="uploaded-files">
                <div className="uploaded-files-header">
                  <h3>Audio Files ({uploadedFiles.length})</h3>
                  <button className="clear-all-button" onClick={clearFiles} title="Clear all files">
                    🗑️ Clear All
                  </button>
                </div>
                <div className="audio-files-list">
                  {uploadedFiles.map(file => (
                    <AudioPlayer key={file.id} audioFile={file} onRemove={removeFile} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <HistoryView />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AudioFilesProvider>
      <AppContent />
    </AudioFilesProvider>
  );
}

export default App;
