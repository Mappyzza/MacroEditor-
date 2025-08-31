import React from 'react';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onNewProject: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNewProject }) => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-header">
          <h1 className="welcome-title">
            <span className="welcome-icon">🎯</span>
            Éditeur de Macro
          </h1>
          <p className="welcome-subtitle">
            Créez et gérez vos macros personnalisées
          </p>
        </div>

        <div className="welcome-actions">
          <button 
            className="welcome-btn welcome-btn-primary"
            onClick={onNewProject}
            title="Créer un nouveau projet de macros"
          >
            <div className="welcome-btn-icon">✨</div>
            <div className="welcome-btn-content">
              <h3>Nouveau Projet</h3>
              <p>Créer un nouveau projet de macros</p>
            </div>
          </button>


        </div>

        <div className="welcome-footer">
          <p className="welcome-help">
            💡 <strong>Conseil :</strong> Chaque projet peut contenir plusieurs macros organisées par type
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
