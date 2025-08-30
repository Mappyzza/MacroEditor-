import React, { useState, useEffect } from 'react';
import './NewMacroModal.css';

interface NewMacroModalProps {
  isVisible: boolean;
  onConfirm: (title: string, description?: string) => void;
  onCancel: () => void;
}

const NewMacroModal: React.FC<NewMacroModalProps> = ({ isVisible, onConfirm, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(title.trim().length >= 3);
  }, [title]);

  useEffect(() => {
    if (isVisible) {
      setTitle('');
      setDescription('');
      // Focus sur le champ titre après un court délai pour l'animation
      setTimeout(() => {
        const titleInput = document.getElementById('macro-title-input') as HTMLInputElement;
        if (titleInput) {
          titleInput.focus();
        }
      }, 100);
    }
  }, [isVisible]);

  // Gestion de la touche Escape et focus
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape, true); // Capture phase
      document.body.style.overflow = 'hidden';
      
      // S'assurer que la modal est au premier plan
      const modalElement = document.querySelector('.new-macro-modal') as HTMLElement;
      if (modalElement) {
        modalElement.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape, true);
      document.body.style.overflow = 'unset';
    };
  }, [isVisible, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onConfirm(title.trim(), description.trim() || undefined);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSubmit(e);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="new-macro-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="new-macro-modal" tabIndex={-1}>
        <div className="modal-header">
          <h3>Créer une nouvelle macro</h3>
          <button 
            className="close-btn" 
            onClick={onCancel}
            title="Annuler"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="macro-title-input" className="form-label required">
              Titre de la macro *
            </label>
            <input
              id="macro-title-input"
              type="text"
              className={`form-control ${!isValid && title.length > 0 ? 'invalid' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: Connexion automatique, Sauvegarde données..."
              maxLength={50}
              autoComplete="off"
            />
            <div className="field-info">
              <span className={`char-count ${title.length >= 45 ? 'warning' : ''}`}>
                {title.length}/50
              </span>
              {!isValid && title.length > 0 && (
                <span className="error-text">
                  Le titre doit contenir au moins 3 caractères
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="macro-description-input" className="form-label">
              Description (optionnelle)
            </label>
            <textarea
              id="macro-description-input"
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement ce que fait cette macro..."
              rows={3}
              maxLength={200}
            />
            <div className="field-info">
              <span className={`char-count ${description.length >= 180 ? 'warning' : ''}`}>
                {description.length}/200
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${!isValid ? 'disabled' : ''}`}
              disabled={!isValid}
            >
              <span className="icon">✨</span>
              Créer la macro
            </button>
          </div>
        </form>

        <div className="modal-footer">
          <small className="help-text">
            💡 Conseil : Choisissez un nom descriptif pour retrouver facilement votre macro
          </small>
        </div>
      </div>
    </div>
  );
};

export default NewMacroModal;
