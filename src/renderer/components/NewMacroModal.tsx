import React, { useState, useEffect, useRef } from 'react';
import './NewMacroModal.css';

interface NewMacroModalProps {
  isVisible: boolean;
  onConfirm: (title: string, description?: string, type?: 'main' | 'branche') => void;
  onCancel: () => void;
}

const NewMacroModal: React.FC<NewMacroModalProps> = ({ isVisible, onConfirm, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [macroType, setMacroType] = useState<'main' | 'branche'>('main');
  const [isValid, setIsValid] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsValid(title.trim().length >= 3);
  }, [title]);

  useEffect(() => {
    if (isVisible) {
      setTitle('');
      setDescription('');
      setMacroType('main');
      setIsValid(false);
      // Focus sur le champ titre après un délai pour s'assurer que la modal est rendue
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          titleInputRef.current.select();
        }
      }, 300);
    }
  }, [isVisible]);

  // Gestion des événements clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible) return;
      
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      } else if (event.key === 'Enter' && event.ctrlKey && isValid) {
        event.preventDefault();
        event.stopPropagation();
        handleSubmit(event as any);
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = 'hidden';
      
      // S'assurer que la modal est au premier plan
      const modalElement = document.querySelector('.new-macro-modal') as HTMLElement;
      if (modalElement) {
        modalElement.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = 'unset';
    };
  }, [isVisible, onCancel, isValid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onConfirm(title.trim(), description.trim() || undefined, macroType);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (descriptionInputRef.current) {
        descriptionInputRef.current.focus();
      }
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
              ref={titleInputRef}
              id="macro-title-input"
              type="text"
              className={`form-control ${!isValid && title.length > 0 ? 'invalid' : ''}`}
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              placeholder="Ex: Connexion automatique, Sauvegarde données..."
              maxLength={50}
              autoComplete="off"
              autoFocus
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
              ref={descriptionInputRef}
              id="macro-description-input"
              className="form-control"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Décrivez brièvement ce que fait cette macro..."
              rows={2}
              maxLength={200}
            />
            <div className="field-info">
              <span className={`char-count ${description.length >= 180 ? 'warning' : ''}`}>
                {description.length}/200
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">
              Type de macro *
            </label>
            <div className="macro-type-selector">
              <div className="type-option">
                <input
                  type="radio"
                  id="macro-type-main"
                  name="macroType"
                  value="main"
                  checked={macroType === 'main'}
                  onChange={(e) => setMacroType(e.target.value as 'main' | 'branche')}
                />
                <label htmlFor="macro-type-main" className="type-label main-type">
                  <div className="type-icon">🎯</div>
                  <div className="type-info">
                    <div className="type-name">Macro Principale</div>
                    <div className="type-description">Macro autonome et complète</div>
                  </div>
                </label>
              </div>
              
              <div className="type-option">
                <input
                  type="radio"
                  id="macro-type-branche"
                  name="macroType"
                  value="branche"
                  checked={macroType === 'branche'}
                  onChange={(e) => setMacroType(e.target.value as 'main' | 'branche')}
                />
                <label htmlFor="macro-type-branche" className="type-label branche-type">
                  <div className="type-icon">🌿</div>
                  <div className="type-info">
                    <div className="type-name">Macro Branche</div>
                    <div className="type-description">Macro secondaire ou spécialisée</div>
                  </div>
                </label>
              </div>
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
              title={!isValid ? 'Veuillez saisir un titre d\'au moins 3 caractères' : 'Créer la macro'}
            >
              <span className="icon">✨</span>
              {isValid ? 'Créer la macro' : 'Titre requis (3+ caractères)'}
            </button>
          </div>
        </form>

        <div className="modal-footer">
          <small className="help-text">
            💡 Conseil : Choisissez un nom descriptif pour retrouver facilement votre macro
            {!isValid && title.length > 0 && (
              <><br />⚠️ Le titre doit contenir au moins 3 caractères pour créer la macro</>
            )}
          </small>
        </div>
      </div>
    </div>
  );
};

export default NewMacroModal;
