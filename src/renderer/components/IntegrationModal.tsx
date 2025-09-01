import React, { useState, useEffect } from 'react';
import { Macro, MacroProject } from '../../types/macro';
import './IntegrationModal.css';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (macroId: string, macroVersion: string) => void;
  currentProject: MacroProject | null;
  currentMacroId?: string; // ID de la macro actuelle (pour éviter l'auto-intégration)
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentProject,
  currentMacroId
}) => {
  const [selectedMacroId, setSelectedMacroId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtrer les macros de type branche disponibles
  const availableMacros = currentProject?.macros.filter(macro => 
    macro.type === 'branche' && 
    macro.id !== currentMacroId &&
    macro.actions.length > 0
  ) || [];

  // Filtrer par terme de recherche
  const filteredMacros = availableMacros.filter(macro =>
    macro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (macro.description && macro.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedMacroId('');
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedMacroId) {
      const selectedMacro = availableMacros.find(m => m.id === selectedMacroId);
      if (selectedMacro) {
        onConfirm(selectedMacroId, selectedMacro.version);
        onClose();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && selectedMacroId) {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="integration-modal-overlay" onClick={onClose}>
      <div className="integration-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="integration-modal-header">
          <h3>🔗 Intégrer une macro</h3>
          <button className="close-btn" onClick={onClose} title="Fermer">
            ✕
          </button>
        </div>
        
        <div className="integration-modal-content">
          <div className="integration-description">
            <p>
              Sélectionnez une macro de type <strong>branche</strong> à intégrer dans votre macro principale.
              L'intégration sera automatiquement mise à jour avec la version actuelle de la macro.
            </p>
          </div>

          <div className="integration-search">
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher une macro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="integration-list">
            {filteredMacros.length === 0 ? (
              <div className="no-macros">
                {availableMacros.length === 0 ? (
                  <>
                    <span className="no-macros-icon">🌿</span>
                    <h4>Aucune macro branche disponible</h4>
                    <p>
                      Créez d'abord des macros de type "branche" pour pouvoir les intégrer.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="no-macros-icon">🔍</span>
                    <h4>Aucun résultat</h4>
                    <p>Essayez avec d'autres termes de recherche.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="macros-grid">
                {filteredMacros.map((macro) => (
                  <div
                    key={macro.id}
                    className={`macro-card ${selectedMacroId === macro.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMacroId(macro.id)}
                  >
                    <div className="macro-card-header">
                      <span className="macro-type-badge branche">🌿</span>
                      <h4 className="macro-name">{macro.name}</h4>
                    </div>
                    
                    {macro.description && (
                      <p className="macro-description">{macro.description}</p>
                    )}
                    
                    <div className="macro-stats">
                      <span className="macro-stat">
                        <strong>{macro.actions.length}</strong> action{macro.actions.length !== 1 ? 's' : ''}
                      </span>
                      <span className="macro-stat">
                        Version <strong>{macro.version}</strong>
                      </span>
                      <span className="macro-stat">
                        Modifiée: <strong>{new Date(macro.modifiedAt).toLocaleDateString()}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="integration-modal-actions">
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Annuler
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!selectedMacroId}
          >
            Intégrer cette macro
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationModal;
