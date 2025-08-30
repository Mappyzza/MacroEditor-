import React from 'react';
import { MacroProject } from '../../types/macro';
import './Header.css';

interface HeaderProps {
  project: MacroProject | null;
  isRecording: boolean;
  isExecuting: boolean;
  onToggleRecording: () => void;
  onToggleActionLibrary: () => void;
  onNewProject: () => void;
}

const Header: React.FC<HeaderProps> = ({
  project,
  isRecording,
  isExecuting,
  onToggleRecording,
  onToggleActionLibrary,
  onNewProject,
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <h1>Éditeur de Macro</h1>
        </div>
        <button
          className="btn btn-sm btn-primary new-project-btn"
          onClick={onNewProject}
          title="Créer un nouveau projet"
          disabled={isExecuting || isRecording}
        >
          <span className="icon">📁</span>
          Nouveau Projet
        </button>
        {project && (
          <div className="project-info">
            <span className="project-name">{project.name}</span>
            {project.filePath && (
              <span className="project-path" title={project.filePath}>
                {project.filePath.split('\\').pop()}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="header-center">
        <div className="toolbar">
          <button
            className={`btn btn-sm ${isRecording ? 'btn-danger' : 'btn-outline-primary'}`}
            onClick={onToggleRecording}
            disabled={isExecuting}
            title={isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement'}
          >
            {isRecording ? (
              <>
                <span className="icon">⏹</span>
                Arrêter
              </>
            ) : (
              <>
                <span className="icon">⏺</span>
                Enregistrer
              </>
            )}
          </button>
          

        </div>
        
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            Enregistrement en cours...
          </div>
        )}
        
        {isExecuting && (
          <div className="executing-indicator">
            <span className="executing-spinner spin">⚙</span>
            Exécution en cours...
          </div>
        )}
      </div>
      
      <div className="header-right">
        <div className="status-indicators">
          {project && (
            <span className="status-item">
              {project.macros.length} macro{project.macros.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
