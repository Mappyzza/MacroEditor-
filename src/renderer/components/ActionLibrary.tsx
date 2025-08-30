import React, { useState, useEffect } from 'react';
import { MacroAction, ActionType } from '../../types/macro';
import './ActionLibrary.css';

const { ipcRenderer } = window.require('electron');

interface ActionLibraryProps {
  onActionAdd: (action: MacroAction) => void;
  onClose: () => void;
  onOpenKeyboardMenu: () => void;
  isVisible: boolean;
}

const ActionLibrary: React.FC<ActionLibraryProps> = ({ onActionAdd, onClose, onOpenKeyboardMenu, isVisible }) => {
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [selectedClickType, setSelectedClickType] = useState<string>('');
  const [mousePosition, setMousePosition] = useState({ x: '', y: '' });

  const getMenuTitle = (menu: string | null) => {
    switch (menu) {
      case 'mouse':
        return 'Actions de souris';
      case 'keyboard':
        return 'Actions de clavier';
      case 'system':
        return 'Actions système';
      case 'advanced':
        return 'Actions avancées';
      default:
        return '';
    }
  };

  const handleAddAction = () => {
    if (!selectedClickType) return;

    const action: MacroAction = {
      id: Date.now().toString(),
      type: 'click' as ActionType,
      target: selectedClickType,
      value: '',
      coordinates: {
        x: mousePosition.x ? parseInt(mousePosition.x) : 0,
        y: mousePosition.y ? parseInt(mousePosition.y) : 0
      },
      delay: 0,
      description: `Clic ${selectedClickType}${mousePosition.x ? ` à (${mousePosition.x}, ${mousePosition.y})` : ''}`
    };

    onActionAdd(action);
    setSelectedClickType('');
    setMousePosition({ x: '', y: '' });
    onClose();
  };

  // Fermer le menu lors de l'appui sur Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  return (
    <>
      {/* Overlay pour fermer en cliquant à côté */}
      {isVisible && (
        <div 
          className="action-library-overlay" 
          onClick={onClose}
        />
      )}
      
      <div className={`action-library-dropdown ${isVisible ? 'visible' : ''}`}>
        {isVisible && (
        <div className="dropdown-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose} title="Fermer la bibliothèque">
            ✕
          </button>
          <div className="library-header">
            <h3>Bibliothèque d'actions</h3>
          </div>

          {!selectedMenu ? (
            <div className="action-menus">
              <h4>Catégories d'actions</h4>
              <div className="menu-grid">
                <button 
                  className="menu-item"
                  onClick={() => setSelectedMenu('mouse')}
                >
                  <span className="menu-icon">🖱️</span>
                  <span className="menu-title">Actions de souris</span>
                  <span className="menu-subtitle">Clics, déplacements, molette</span>
                </button>
                
                <button 
                  className="menu-item"
                  onClick={() => setSelectedMenu('keyboard')}
                >
                  <span className="menu-icon">⌨️</span>
                  <span className="menu-title">Actions de clavier</span>
                  <span className="menu-subtitle">Frappes, raccourcis</span>
                </button>
                
                <button 
                  className="menu-item"
                  onClick={() => setSelectedMenu('system')}
                >
                  <span className="menu-icon">⚙️</span>
                  <span className="menu-title">Actions système</span>
                  <span className="menu-subtitle">Applications, fichiers</span>
                </button>
                
                <button 
                  className="menu-item"
                  onClick={() => setSelectedMenu('advanced')}
                >
                  <span className="menu-icon">🔧</span>
                  <span className="menu-title">Actions avancées</span>
                  <span className="menu-subtitle">Scripts, conditions</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="action-details">
              <div className="action-header">
                <button 
                  className="back-btn"
                  onClick={() => setSelectedMenu(null)}
                >
                  ← Retour
                </button>
                <h4>{getMenuTitle(selectedMenu)}</h4>
              </div>
              
              <div className="action-content">
                {selectedMenu === 'mouse' && (
                  <div className="mouse-actions">
                    <div className="click-types">
                      <h5>Type de clic</h5>
                      <div className="button-group">
                        <button 
                          className={`type-btn ${selectedClickType === 'left' ? 'active' : ''}`}
                          onClick={() => setSelectedClickType('left')}
                        >
                          Clic gauche
                        </button>
                        <button 
                          className={`type-btn ${selectedClickType === 'right' ? 'active' : ''}`}
                          onClick={() => setSelectedClickType('right')}
                        >
                          Clic droit
                        </button>
                        <button 
                          className={`type-btn ${selectedClickType === 'middle' ? 'active' : ''}`}
                          onClick={() => setSelectedClickType('middle')}
                        >
                          Clic molette
                        </button>
                        <button 
                          className={`type-btn ${selectedClickType === 'double' ? 'active' : ''}`}
                          onClick={() => setSelectedClickType('double')}
                        >
                          Double-clic
                        </button>
                      </div>
                    </div>
                    
                    <div className="position-input">
                      <h5>Position (optionnel)</h5>
                      <div className="input-row">
                        <input 
                          type="number" 
                          placeholder="X" 
                          value={mousePosition.x || ''} 
                          onChange={(e) => setMousePosition({...mousePosition, x: e.target.value})}
                        />
                        <input 
                          type="number" 
                          placeholder="Y" 
                          value={mousePosition.y || ''} 
                          onChange={(e) => setMousePosition({...mousePosition, y: e.target.value})}
                        />
                      </div>
                      <small>Laissez vide pour utiliser la position actuelle</small>
                    </div>
                    
                    <div className="action-controls">
                      <button 
                        className="add-action-btn"
                        onClick={handleAddAction}
                        disabled={!selectedClickType}
                      >
                        <span className="icon">+</span>
                        Ajouter l'action
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </>
  );
};

export default ActionLibrary;