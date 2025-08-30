import React, { useState, useEffect } from 'react';
import { MacroAction, ActionType } from '../../types/macro';
import './ActionSidebar.css';

const { ipcRenderer } = window.require('electron');

interface ActionSidebarProps {
  onActionAdd: (action: MacroAction) => void;
  onClose: () => void;
  isVisible: boolean;
  initialActionType?: string;
}

interface MouseClickConfig {
  clickType: 'simple' | 'double' | 'triple' | '';
  buttonType: 'left' | 'right' | '';
  position?: { x: number; y: number };
}

interface KeyboardConfig {
  actionType: 'keypress' | 'type' | '';
  key?: string;
  text?: string;
  modifiers?: string[];
}

interface SystemConfig {
  actionType: 'wait' | 'move' | 'scroll' | '';
  delay?: number;
  position?: { x: number; y: number };
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
}

const ActionSidebar: React.FC<ActionSidebarProps> = ({ onActionAdd, onClose, isVisible, initialActionType }) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [mouseConfig, setMouseConfig] = useState<MouseClickConfig>({
    clickType: 'simple',
    buttonType: 'left',
    position: undefined
  });
  const [keyboardConfig, setKeyboardConfig] = useState<KeyboardConfig>({
    actionType: '',
    key: '',
    text: '',
    modifiers: []
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    actionType: '',
    delay: 1000,
    position: undefined,
    direction: 'up',
    amount: 3
  });
  const [isCapturingPosition, setIsCapturingPosition] = useState(false);

  // Gérer la capture d'écran/position
  const handlePositionCapture = async (): Promise<{ x: number; y: number } | null> => {
    try {
      setIsCapturingPosition(true);
      
      // Demander au processus principal de démarrer la capture
      const result = await ipcRenderer.invoke('start-position-capture');
      
      if (result && result.x !== undefined && result.y !== undefined) {
        return { x: result.x, y: result.y };
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la capture de position:', error);
      return null;
    } finally {
      setIsCapturingPosition(false);
    }
  };

  const handleAddMouseAction = () => {
    if (!mouseConfig.clickType || !mouseConfig.buttonType) {
      alert('Veuillez sélectionner le type de clic et le bouton');
      return;
    }

    let actionType: ActionType = 'click';
    let target = mouseConfig.buttonType;
    let description = `Clic ${mouseConfig.buttonType}`;

    // Ajuster selon le type de clic
    if (mouseConfig.clickType === 'double') {
      description = `Double-clic ${mouseConfig.buttonType}`;
    } else if (mouseConfig.clickType === 'triple') {
      description = `Triple-clic ${mouseConfig.buttonType}`;
    }

    const action: MacroAction = {
      id: Date.now().toString(),
      type: actionType,
      target: target,
      value: mouseConfig.clickType === 'double' ? 2 : mouseConfig.clickType === 'triple' ? 3 : 1,
      coordinates: mouseConfig.position || { x: 0, y: 0 },
      delay: 0,
      description: description + (mouseConfig.position ? ` à (${mouseConfig.position.x}, ${mouseConfig.position.y})` : '')
    };

    onActionAdd(action);
    resetMouseConfig();
    setSelectedAction(null);
  };

  const resetMouseConfig = () => {
    setMouseConfig({
      clickType: 'simple',
      buttonType: 'left',
      position: undefined
    });
  };

  const resetKeyboardConfig = () => {
    setKeyboardConfig({
      actionType: '',
      key: '',
      text: '',
      modifiers: []
    });
  };

  const resetSystemConfig = () => {
    setSystemConfig({
      actionType: '',
      delay: 1000,
      position: undefined,
      direction: 'up',
      amount: 3
    });
  };

  const handleAddKeyboardAction = () => {
    if (!keyboardConfig.actionType) {
      alert('Veuillez sélectionner un type d\'action clavier');
      return;
    }

    let actionType: ActionType;
    let value: string | number = '';
    let description = '';

    if (keyboardConfig.actionType === 'keypress') {
      if (!keyboardConfig.key) {
        alert('Veuillez spécifier une touche');
        return;
      }
      actionType = 'keypress';
      value = keyboardConfig.key;
      description = `Appui sur ${keyboardConfig.key}`;
      if (keyboardConfig.modifiers && keyboardConfig.modifiers.length > 0) {
        description = `${keyboardConfig.modifiers.join('+')}+${keyboardConfig.key}`;
      }
    } else {
      if (!keyboardConfig.text) {
        alert('Veuillez saisir le texte à écrire');
        return;
      }
      actionType = 'type';
      value = keyboardConfig.text;
      description = `Saisie: "${keyboardConfig.text}"`;
    }

    const action: MacroAction = {
      id: Date.now().toString(),
      type: actionType,
      target: keyboardConfig.modifiers?.join('+'),
      value: value,
      delay: 0,
      description: description
    };

    onActionAdd(action);
    resetKeyboardConfig();
    setSelectedAction(null);
  };

  const handleAddSystemAction = () => {
    if (!systemConfig.actionType) {
      alert('Veuillez sélectionner un type d\'action système');
      return;
    }

    let actionType: ActionType;
    let value: string | number = '';
    let description = '';
    let coordinates: { x: number; y: number } | undefined;

    switch (systemConfig.actionType) {
      case 'wait':
        actionType = 'wait';
        value = systemConfig.delay || 1000;
        description = `Attendre ${systemConfig.delay}ms`;
        break;
      case 'move':
        if (!systemConfig.position) {
          alert('Veuillez capturer une position pour le déplacement');
          return;
        }
        actionType = 'move';
        coordinates = systemConfig.position;
        description = `Déplacer vers (${systemConfig.position.x}, ${systemConfig.position.y})`;
        break;
      case 'scroll':
        actionType = 'scroll';
        value = systemConfig.amount || 3;
        description = `Défiler ${systemConfig.direction} (${systemConfig.amount} crans)`;
        break;
    }

    const action: MacroAction = {
      id: Date.now().toString(),
      type: actionType,
      target: systemConfig.direction,
      value: value,
      coordinates: coordinates,
      delay: 0,
      description: description
    };

    onActionAdd(action);
    resetSystemConfig();
    setSelectedAction(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (selectedAction) {
        setSelectedAction(null);
        resetMouseConfig();
        resetKeyboardConfig();
        resetSystemConfig();
      } else {
        onClose();
      }
    }
  };

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      // Si un type d'action initial est spécifié, l'ouvrir directement
      if (initialActionType) {
        setSelectedAction(initialActionType);
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, selectedAction, initialActionType]);

  // Reset quand la sidebar se ferme
  useEffect(() => {
    if (!isVisible) {
      setSelectedAction(null);
      resetMouseConfig();
      resetKeyboardConfig();
      resetSystemConfig();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <div className="action-sidebar-overlay" onClick={onClose} />
      
      <div className="action-sidebar">
        <div className="action-sidebar-header">
          <h3>Actions disponibles</h3>
          <button className="close-btn" onClick={onClose} title="Fermer">
            ✕
          </button>
        </div>

        <div className="action-compact-menu">
          <div className="compact-actions-grid">
            <button 
              className="compact-action-btn mouse-action"
              onClick={() => setSelectedAction('mouse')}
              title="Actions de clic et sélection"
            >
              <div className="compact-icon">👆</div>
              <div className="compact-title">Clic</div>
              <div className="compact-subtitle">Actions de clic et sélection</div>
            </button>

            <button 
              className="compact-action-btn keyboard-action"
              onClick={() => setSelectedAction('keyboard')}
              title="Touches du clavier et saisie de texte"
            >
              <div className="compact-icon">⌨️</div>
              <div className="compact-title">Touches</div>
              <div className="compact-subtitle">Touches du clavier et saisie de texte</div>
            </button>

            <button 
              className="compact-action-btn system-action"
              onClick={() => setSelectedAction('system')}
              title="Pauses et temporisation"
            >
              <div className="compact-icon">⏱️</div>
              <div className="compact-title">Délai</div>
              <div className="compact-subtitle">Pauses et temporisation</div>
            </button>

            <button 
              className="compact-action-btn advanced-action"
              onClick={() => setSelectedAction('advanced')}
              title="Mouvement de souris et défilement"
            >
              <div className="compact-icon">🖱️</div>
              <div className="compact-title">Déplacement</div>
              <div className="compact-subtitle">Mouvement de souris et défilement</div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de configuration au centre */}
      {selectedAction && (
        <>
          <div 
            className="action-config-overlay" 
            onClick={() => {
              setSelectedAction(null);
              resetMouseConfig();
              resetKeyboardConfig();
              resetSystemConfig();
            }}
          />
          
          <div className="action-config-modal">
            <div className="action-config-header">
              <button 
                className="config-back-btn"
                onClick={() => {
                  setSelectedAction(null);
                  resetMouseConfig();
                  resetKeyboardConfig();
                  resetSystemConfig();
                }}
              >
                ← Retour
              </button>
              <h4>
                {selectedAction === 'mouse' && 'Configuration du clic de souris'}
                {selectedAction === 'keyboard' && 'Actions de clavier'}
                {selectedAction === 'system' && 'Actions système'}
                {selectedAction === 'advanced' && 'Actions avancées'}
              </h4>
            </div>

            <div className="action-config-content">
              {selectedAction === 'mouse' && (
                <div className="mouse-config">
                  <div className="mouse-config-left">
                    {/* Type de clic */}
                    <div className="config-section-compact">
                      <h5>Type de clic</h5>
                      <div className="button-group">
                        <button 
                          className={`config-btn ${mouseConfig.clickType === 'simple' ? 'active' : ''}`}
                          onClick={() => setMouseConfig(prev => ({ ...prev, clickType: 'simple' }))}
                        >
                          Simple
                        </button>
                        <button 
                          className={`config-btn ${mouseConfig.clickType === 'double' ? 'active' : ''}`}
                          onClick={() => setMouseConfig(prev => ({ ...prev, clickType: 'double' }))}
                        >
                          Double
                        </button>
                        <button 
                          className={`config-btn ${mouseConfig.clickType === 'triple' ? 'active' : ''}`}
                          onClick={() => setMouseConfig(prev => ({ ...prev, clickType: 'triple' }))}
                        >
                          Triple
                        </button>
                      </div>
                    </div>

                    {/* Bouton de souris */}
                    <div className="config-section-compact">
                      <h5>Bouton de souris</h5>
                      <div className="button-group">
                        <button 
                          className={`config-btn ${mouseConfig.buttonType === 'left' ? 'active' : ''}`}
                          onClick={() => setMouseConfig(prev => ({ ...prev, buttonType: 'left' }))}
                        >
                          Clic gauche
                        </button>
                        <button 
                          className={`config-btn ${mouseConfig.buttonType === 'right' ? 'active' : ''}`}
                          onClick={() => setMouseConfig(prev => ({ ...prev, buttonType: 'right' }))}
                        >
                          Clic droit
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mouse-config-right">
                    {/* Position */}
                    <div className="config-section-compact">
                      <h5>Position du clic</h5>
                      <div className="position-config">
                        {mouseConfig.position ? (
                          <div className="position-display">
                            <span>X={mouseConfig.position.x}, Y={mouseConfig.position.y}</span>
                            <button 
                              className="clear-position-btn"
                              onClick={() => setMouseConfig(prev => ({ ...prev, position: undefined }))}
                            >
                              Effacer
                            </button>
                          </div>
                        ) : (
                          <p style={{fontSize: 'var(--font-size-xs)', margin: '0 0 var(--spacing-sm) 0'}}>
                            Aucune position définie (utilisera la position actuelle du curseur)
                          </p>
                        )}
                        
                        <button 
                          className="capture-btn"
                          onClick={async () => {
                            const result = await handlePositionCapture();
                            if (result) {
                              setMouseConfig(prev => ({ ...prev, position: result }));
                            }
                          }}
                          disabled={isCapturingPosition}
                        >
                          {isCapturingPosition ? 'Capture...' : '📸 Capturer'}
                        </button>
                      </div>
                    </div>

                    {/* Bouton d'ajout */}
                    <div className="config-section-compact">
                      <button 
                        className="add-action-btn"
                        onClick={handleAddMouseAction}
                        disabled={!mouseConfig.clickType || !mouseConfig.buttonType}
                      >
                        + Ajouter cette action
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedAction === 'keyboard' && (
                <div className="keyboard-config">
                  {/* Type d'action clavier */}
                  <div className="config-section">
                    <h5>Type d'action</h5>
                    <div className="button-group">
                      <button 
                        className={`config-btn ${keyboardConfig.actionType === 'keypress' ? 'active' : ''}`}
                        onClick={() => setKeyboardConfig(prev => ({ ...prev, actionType: 'keypress' }))}
                      >
                        Appui sur touche
                      </button>
                      <button 
                        className={`config-btn ${keyboardConfig.actionType === 'type' ? 'active' : ''}`}
                        onClick={() => setKeyboardConfig(prev => ({ ...prev, actionType: 'type' }))}
                      >
                        Saisir du texte
                      </button>
                    </div>
                  </div>

                  {keyboardConfig.actionType === 'keypress' && (
                    <>
                      {/* Modificateurs */}
                      <div className="config-section">
                        <h5>Modificateurs (optionnel)</h5>
                        <div className="modifier-group">
                          {['Ctrl', 'Alt', 'Shift', 'Win'].map(modifier => (
                            <label key={modifier} className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={keyboardConfig.modifiers?.includes(modifier) || false}
                                onChange={(e) => {
                                  const modifiers = [...(keyboardConfig.modifiers || [])];
                                  if (e.target.checked) {
                                    modifiers.push(modifier);
                                  } else {
                                    const index = modifiers.indexOf(modifier);
                                    if (index > -1) modifiers.splice(index, 1);
                                  }
                                  setKeyboardConfig(prev => ({ ...prev, modifiers }));
                                }}
                              />
                              {modifier}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Touche */}
                      <div className="config-section">
                        <h5>Touche</h5>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: Enter, Space, F1, a, 1..."
                          value={keyboardConfig.key || ''}
                          onChange={(e) => setKeyboardConfig(prev => ({ ...prev, key: e.target.value }))}
                        />
                      </div>
                    </>
                  )}

                  {keyboardConfig.actionType === 'type' && (
                    <div className="config-section">
                      <h5>Texte à saisir</h5>
                      <textarea
                        className="form-textarea"
                        placeholder="Tapez le texte à saisir..."
                        value={keyboardConfig.text || ''}
                        onChange={(e) => setKeyboardConfig(prev => ({ ...prev, text: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Bouton d'ajout */}
                  <div className="config-section">
                    <button 
                      className="add-action-btn"
                      onClick={handleAddKeyboardAction}
                      disabled={!keyboardConfig.actionType || 
                        (keyboardConfig.actionType === 'keypress' && !keyboardConfig.key) ||
                        (keyboardConfig.actionType === 'type' && !keyboardConfig.text)}
                    >
                      + Ajouter cette action
                    </button>
                  </div>
                </div>
              )}

              {selectedAction === 'system' && (
                <div className="system-config">
                  {/* Type d'action système */}
                  <div className="config-section">
                    <h5>Type d'action</h5>
                    <div className="button-group">
                      <button 
                        className={`config-btn ${systemConfig.actionType === 'wait' ? 'active' : ''}`}
                        onClick={() => setSystemConfig(prev => ({ ...prev, actionType: 'wait' }))}
                      >
                        Attendre
                      </button>
                      <button 
                        className={`config-btn ${systemConfig.actionType === 'move' ? 'active' : ''}`}
                        onClick={() => setSystemConfig(prev => ({ ...prev, actionType: 'move' }))}
                      >
                        Déplacer curseur
                      </button>
                      <button 
                        className={`config-btn ${systemConfig.actionType === 'scroll' ? 'active' : ''}`}
                        onClick={() => setSystemConfig(prev => ({ ...prev, actionType: 'scroll' }))}
                      >
                        Défiler
                      </button>
                    </div>
                  </div>

                  {systemConfig.actionType === 'wait' && (
                    <div className="config-section">
                      <h5>Durée d'attente (millisecondes)</h5>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="1000"
                        value={systemConfig.delay || ''}
                        onChange={(e) => setSystemConfig(prev => ({ ...prev, delay: parseInt(e.target.value) || 1000 }))}
                        min="0"
                      />
                    </div>
                  )}

                  {systemConfig.actionType === 'move' && (
                    <div className="config-section">
                      <h5>Position de destination</h5>
                      <div className="position-config">
                        {systemConfig.position ? (
                          <div className="position-display">
                            <span>Position: X={systemConfig.position.x}, Y={systemConfig.position.y}</span>
                            <button 
                              className="clear-position-btn"
                              onClick={() => setSystemConfig(prev => ({ ...prev, position: undefined }))}
                            >
                              Effacer
                            </button>
                          </div>
                        ) : (
                          <p>Aucune position définie</p>
                        )}
                        
                        <button 
                          className="capture-btn"
                          onClick={() => {
                            handlePositionCapture().then(result => {
                              if (result) {
                                setSystemConfig(prev => ({ ...prev, position: result }));
                              }
                            });
                          }}
                          disabled={isCapturingPosition}
                        >
                          {isCapturingPosition ? 'Capture en cours...' : '📸 Capturer la position'}
                        </button>
                      </div>
                    </div>
                  )}

                  {systemConfig.actionType === 'scroll' && (
                    <>
                      <div className="config-section">
                        <h5>Direction</h5>
                        <div className="button-group">
                          {['up', 'down', 'left', 'right'].map(dir => (
                            <button 
                              key={dir}
                              className={`config-btn ${systemConfig.direction === dir ? 'active' : ''}`}
                              onClick={() => setSystemConfig(prev => ({ ...prev, direction: dir as any }))}
                            >
                              {dir === 'up' ? 'Haut' : dir === 'down' ? 'Bas' : dir === 'left' ? 'Gauche' : 'Droite'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="config-section">
                        <h5>Nombre de crans</h5>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="3"
                          value={systemConfig.amount || ''}
                          onChange={(e) => setSystemConfig(prev => ({ ...prev, amount: parseInt(e.target.value) || 3 }))}
                          min="1"
                          max="10"
                        />
                      </div>
                    </>
                  )}

                  {/* Bouton d'ajout */}
                  <div className="config-section">
                    <button 
                      className="add-action-btn"
                      onClick={handleAddSystemAction}
                      disabled={!systemConfig.actionType || 
                        (systemConfig.actionType === 'move' && !systemConfig.position)}
                    >
                      + Ajouter cette action
                    </button>
                  </div>
                </div>
              )}

              {selectedAction === 'advanced' && (
                <div className="advanced-config">
                  <div className="config-section">
                    <h5>Actions avancées</h5>
                    <p>Fonctionnalités avancées à venir :</p>
                    <ul>
                      <li>Conditions et boucles</li>
                      <li>Scripts personnalisés</li>
                      <li>Variables et calculs</li>
                      <li>Reconnaissance d'images</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ActionSidebar;

