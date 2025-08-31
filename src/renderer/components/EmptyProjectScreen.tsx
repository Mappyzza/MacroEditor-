import React from 'react';
import './EmptyProjectScreen.css';

interface EmptyProjectScreenProps {
  projectName: string;
  hasMacros: boolean;
  onLoadMacro: () => void;
  onCreateMacro: () => void;
}

const EmptyProjectScreen: React.FC<EmptyProjectScreenProps> = ({ 
  projectName, 
  hasMacros, 
  onLoadMacro, 
  onCreateMacro 
}) => {
  return (
    <div className="empty-project-screen">
      <div className="empty-project-content">
        <div className="empty-project-header">
          <h2 className="empty-project-title">
            <span className="empty-project-icon">📁</span>
            {projectName}
          </h2>
          <p className="empty-project-subtitle">
            {hasMacros 
              ? 'Sélectionnez une macro existante ou créez-en une nouvelle'
              : 'Commencez par créer votre première macro'
            }
          </p>
        </div>

        <div className="empty-project-actions">
          {hasMacros && (
            <button 
              className="empty-project-btn empty-project-btn-primary"
              onClick={onLoadMacro}
              title="Ouvrir la liste des macros existantes"
            >
              <div className="empty-project-btn-icon">📋</div>
              <div className="empty-project-btn-content">
                <h3>Charger une macro</h3>
                <p>Ouvrir la liste des macros existantes</p>
              </div>
            </button>
          )}

          <button 
            className="empty-project-btn empty-project-btn-secondary"
            onClick={onCreateMacro}
            title="Créer une nouvelle macro"
          >
            <div className="empty-project-btn-icon">✨</div>
            <div className="empty-project-btn-content">
              <h3>Créer une macro</h3>
              <p>Créer une nouvelle macro personnalisée</p>
            </div>
          </button>
        </div>

        <div className="empty-project-footer">
          <p className="empty-project-help">
            💡 <strong>Conseil :</strong> {hasMacros 
              ? 'Utilisez la sidebar pour naviguer entre vos macros'
              : 'Votre première macro vous permettra de commencer à automatiser vos tâches'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyProjectScreen;
