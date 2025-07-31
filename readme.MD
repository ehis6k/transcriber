# Transcriber 🎤

A local-first desktop application for transcribing and summarizing audio memos with privacy in mind.

![Transcriber App](https://img.shields.io/badge/Platform-Desktop-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-0.1.0-orange)

## 🌟 Features

- **🔒 Privacy-First**: All processing happens locally on your device - no data leaves your computer
- **🎯 Local Transcription**: Powered by Whisper.js for accurate speech-to-text conversion
- **📝 Smart Summarization**: AI-powered summarization of transcribed content
- **🌍 Multi-Language Support**: Auto-detection and support for multiple languages
- **📊 Audio Visualization**: Waveform display with interactive playback controls
- **💾 Local Storage**: SQLite database for storing transcription history
- **📤 Export Options**: Export transcripts in multiple formats (TXT, PDF, DOCX, Markdown)
- **🎨 Modern UI**: Clean, intuitive interface built with React and Tauri

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (for Tauri backend)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ehis6k/transcriber.git
   cd transcriber
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run tauri:dev
   ```

The app will open in a new window automatically.

## 📖 Usage

### Uploading Audio Files

1. **Drag & Drop**: Simply drag audio files into the upload area
2. **File Picker**: Click the upload button to browse and select files
3. **Supported Formats**: MP3, WAV, M4A, FLAC, OGG

### Transcription

1. Upload your audio file
2. Select language (or use auto-detection)
3. Choose model size (tiny, base, small for different accuracy/speed trade-offs)
4. Click "Start Transcription"
5. Wait for processing to complete

### Audio Playback

- Use the built-in audio player to preview your files
- Interactive waveform visualization
- Standard playback controls (play, pause, stop, seek)
- Volume control

### Viewing History

- Switch to the "History" tab to view past transcriptions
- Search and filter by language, model, or date
- Export individual transcriptions or bulk data

## 🛠️ Development

### Project Structure

```
transcriber/
├── src/                    # Frontend React code
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic services
│   ├── models/           # TypeScript interfaces
│   ├── utils/            # Utility functions
│   └── styles.css        # Global styles
├── src-tauri/            # Tauri backend
│   ├── src/             # Rust source code
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri configuration
└── public/              # Static assets
```

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run tauri:dev` - Start Tauri development mode
- `npm run tauri:build` - Build Tauri application
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Technology Stack

#### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **CSS3** - Styling

#### AI/ML
- **Transformers.js** - Local ML inference
- **Whisper** - Speech recognition models
- **ONNX Runtime** - ML model execution

#### Backend
- **Tauri** - Desktop application framework
- **Rust** - Systems programming language
- **SQLite** - Local database storage

#### Testing
- **Vitest** - Unit testing framework
- **Testing Library** - React component testing

## 🔧 Configuration

### Audio Settings

Edit `src/config/development.ts` to adjust:

```typescript
export const DEV_CONFIG = {
  MAX_FILE_SIZE_MB: 100,
  SUPPORTED_FORMATS: ['wav', 'mp3', 'm4a', 'flac', 'ogg'],
  PROCESSING_TIMEOUT_MS: 300000, // 5 minutes
};
```

### Model Settings

Transcription models available:
- **tiny**: Fastest, least accurate
- **base**: Balanced speed and accuracy (recommended)
- **small**: Slower, more accurate

## 🐛 Troubleshooting

### Common Issues

#### Audio Won't Play
- Ensure the audio format is supported
- Check browser console for error messages
- Try converting to MP3 or WAV format

#### Transcription Fails
- Check if the audio file is not corrupted
- Ensure sufficient disk space for model downloads
- Try using a smaller model size

#### Database Errors
- Clear application data if corruption occurs
- Check file permissions in the app directory

### Debug Mode

Enable detailed logging by setting `DEBUG_MODE: true` in the development config.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Whisper](https://openai.com/research/whisper) by OpenAI for the transcription models
- [Transformers.js](https://huggingface.co/docs/transformers.js) for browser-based ML inference
- [Tauri](https://tauri.app/) for the cross-platform desktop framework

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing [GitHub issues](https://github.com/ehis6k/transcriber/issues)
3. Create a new issue with detailed information

---

**Made with ❤️ for privacy-conscious users who value local-first applications.**
