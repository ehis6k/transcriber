/**
 * Navigation component for switching between app views
 */

interface NavigationProps {
  currentView: 'transcription' | 'history';
  onViewChange: (view: 'transcription' | 'history') => void;
  className?: string;
}

export function Navigation({ currentView, onViewChange, className = '' }: NavigationProps) {
  return (
    <div className={`navigation ${className}`}>
      <div className="nav-tabs">
        <button
          className={`nav-tab ${currentView === 'transcription' ? 'active' : ''}`}
          onClick={() => onViewChange('transcription')}
        >
          🎤 Transcribe
        </button>
        <button
          className={`nav-tab ${currentView === 'history' ? 'active' : ''}`}
          onClick={() => onViewChange('history')}
        >
          📚 History
        </button>
      </div>
    </div>
  );
} 