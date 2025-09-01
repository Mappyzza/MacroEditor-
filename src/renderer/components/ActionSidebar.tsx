import React, { useState, useEffect } from 'react';
import { MacroAction, ActionType, MacroProject } from '../../types/macro';
import './ActionSidebar.css';

const { ipcRenderer } = window.require('electron');

interface ActionSidebarProps {
  onActionAdd: (action: MacroAction) => void;
  onActionUpdate?: (actionId: string, updatedAction: MacroAction) => void;
  onClose: () => void;
  isVisible: boolean;
  initialActionType?: string;
  editingAction?: MacroAction | null;
  currentProject?: MacroProject | null;
}

interface MouseClickConfig {
  clickType: 'simple' | 'double' | 'triple' | '';
  buttonType: 'left' | 'right' | '';
  position?: { x: number; y: number };
}

interface KeyboardConfig {
  actionType: 'keypress' | 'type' | '';
  key: string;
  text: string;
  modifiers: string[];
}

interface SystemConfig {
  actionType: 'wait' | 'move' | 'scroll' | '';
  delay?: number;
  position?: { x: number; y: number };
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
}

const ActionSidebar: React.FC<ActionSidebarProps> = ({ onActionAdd, onActionUpdate, onClose, isVisible, initialActionType, editingAction, currentProject }) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [mouseConfig, setMouseConfig] = useState<MouseClickConfig>({
    clickType: 'simple',
    buttonType: 'left',
    position: undefined
  });
  const [keyboardConfig, setKeyboardConfig] = useState<KeyboardConfig>({
    actionType: '',
    modifiers: [],
    key: '',
    text: ''
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    actionType: '',
    delay: 1000,
    position: undefined,
    direction: 'up',
    amount: 3
  });
  const [isCapturingPosition, setIsCapturingPosition] = useState(false);

  const [showKeyboardMenu, setShowKeyboardMenu] = useState(false);
  const [keyboardMenuType, setKeyboardMenuType] = useState<'text' | 'virtual'>('text');

  // Gérer la capture d'écran/position
  const handlePositionCapture = async (): Promise<{ x: number; y: number } | null> => {
    try {
      setIsCapturingPosition(true);
      
      // Demander au processus principal de démarrer la capture en temps réel
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

  // Annuler la capture de position
  const handleCancelCapture = async () => {
    try {
      await ipcRenderer.invoke('cancel-position-capture');
      setIsCapturingPosition(false);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la capture:', error);
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
      id: editingAction?.id || Date.now().toString(),
      type: actionType,
      target: target,
      value: mouseConfig.clickType === 'double' ? 2 : mouseConfig.clickType === 'triple' ? 3 : 1,
      coordinates: mouseConfig.position || { x: 0, y: 0 },
      delay: 0,
      description: description + (mouseConfig.position ? ` à (${mouseConfig.position.x}, ${mouseConfig.position.y})` : ''),
      repeatCount: editingAction?.repeatCount || 1
    };

    if (editingAction && onActionUpdate) {
      onActionUpdate(editingAction.id, action);
    } else {
      onActionAdd(action);
    }
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
      modifiers: [],
      key: '',
      text: ''
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

  // Fonction pour mapper les noms des touches spéciales vers leurs codes appropriés
  const mapSpecialKey = (keyName: string): string => {
    const keyMap: { [key: string]: string } = {
      'Enter': '{ENTER}',
      'Backspace': '{BACKSPACE}',
      'Tab': '{TAB}',
      'Space': ' ',
      'Esc': '{ESC}',
      'Escape': '{ESC}',
      'CapsLock': '{CAPSLOCK}',
      'Shift': '{SHIFT}',
      'Ctrl': '{CTRL}',
      'Alt': '{ALT}',
      'Win': '{LWIN}',
      'Menu': '{APPS}',
      'Delete': '{DELETE}',
      'Insert': '{INSERT}',
      'Home': '{HOME}',
      'End': '{END}',
      'PageUp': '{PGUP}',
      'PageDown': '{PGDN}',
      'Up': '{UP}',
      'Down': '{DOWN}',
      'Left': '{LEFT}',
      'Right': '{RIGHT}',
      'F1': '{F1}',
      'F2': '{F2}',
      'F3': '{F3}',
      'F4': '{F4}',
      'F5': '{F5}',
      'F6': '{F6}',
      'F7': '{F7}',
      'F8': '{F8}',
      'F9': '{F9}',
      'F10': '{F10}',
      'F11': '{F11}',
      'F12': '{F12}',
      '[': '[',
      ']': ']',
      '\\': '\\',
      ';': ';',
      "'": "'",
      ',': ',',
      '.': '.',
      '/': '/',
      '`': '`',
      '-': '-',
      '=': '='
    };
    
    return keyMap[keyName] || keyName;
  };

  // Fonction pour construire une combinaison de touches au format AutoHotkey
  const buildKeyCombination = (keysArray: string[]): string => {
    if (keysArray.length === 0) return '';
    
    // Séparer les modificateurs des autres touches
    const modifiers = keysArray.filter(key => ['Ctrl', 'Alt', 'Shift', 'Win'].includes(key));
    const otherKeys = keysArray.filter(key => !['Ctrl', 'Alt', 'Shift', 'Win'].includes(key));
    
    if (keysArray.length === 1) {
      // Une seule touche
      const key = keysArray[0];
      if (key.length === 1 && /^[A-Z]$/.test(key)) {
        // Touche alphabétique seule - convertir en minuscule
        return key.toLowerCase();
      } else {
        // Touche spéciale - utiliser le mapping
        return mapSpecialKey(key);
      }
    } else if (modifiers.length > 0 && otherKeys.length > 0) {
      // Combinaison de touches avec modificateurs
      let modifierPrefix = '';
      if (modifiers.includes('Ctrl')) modifierPrefix += '^';
      if (modifiers.includes('Alt')) modifierPrefix += '!';
      if (modifiers.includes('Shift')) modifierPrefix += '+';
      if (modifiers.includes('Win')) modifierPrefix += '#';
      
      // Prendre la première touche non-modificateur et la mapper
      const mainKey = otherKeys[0];
      let keyCode = '';
      
      if (mainKey.length === 1 && /^[A-Z]$/.test(mainKey)) {
        // Touche alphabétique - convertir en minuscule pour AutoHotkey
        keyCode = mainKey.toLowerCase();
      } else {
        // Touche spéciale - utiliser le mapping
        keyCode = mapSpecialKey(mainKey);
      }
      
      return modifierPrefix + keyCode;
    } else {
      // Pas de modificateurs, juste des touches multiples
      return keysArray.map(key => {
        if (key.length === 1 && /^[A-Z]$/.test(key)) {
          return key.toLowerCase();
        }
        return mapSpecialKey(key);
      }).join('+');
    }
  };

  const handleAddKeyboardAction = () => {
    let actionType: ActionType;
    let value: string | number = '';
    let description = '';

    if (keyboardMenuType === 'text') {
      // Mode saisie de texte
      if (!keyboardConfig.text.trim()) {
        alert('Veuillez saisir du texte');
        return;
      }
      actionType = 'type';
      value = keyboardConfig.text;
      description = `Saisie: "${keyboardConfig.text}"`;
    } else {
      // Mode clavier virtuel
      if (keyboardConfig.modifiers.length === 0) {
        alert('Veuillez sélectionner au moins une touche');
        return;
      }
      actionType = 'keypress';
      
      // Utiliser la nouvelle fonction pour construire la combinaison
      const keysArray = keyboardConfig.modifiers;
      const combinationString = buildKeyCombination(keysArray);
      
      value = combinationString;
      description = `Combinaison: ${keysArray.join(' + ')}`;
    }

    const action: MacroAction = {
      id: editingAction?.id || Date.now().toString(),
      type: actionType,
      target: keyboardConfig.modifiers.join('+'),
      value: value,
      delay: 0,
      description: description,
      repeatCount: editingAction?.repeatCount || 1
    };

    if (editingAction && onActionUpdate) {
      onActionUpdate(editingAction.id, action);
    } else {
      onActionAdd(action);
    }
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
      id: editingAction?.id || Date.now().toString(),
      type: actionType,
      target: systemConfig.direction,
      value: value,
      coordinates: coordinates,
      delay: systemConfig.actionType === 'wait' ? (systemConfig.delay || 1000) : 0,
      description: description,
      repeatCount: editingAction?.repeatCount || 1
    };

    if (editingAction && onActionUpdate) {
      onActionUpdate(editingAction.id, action);
    } else {
      onActionAdd(action);
    }
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

  const handleOpenKeyboardMenu = async (type: 'text' | 'virtual') => {
    setKeyboardMenuType(type);
    setShowKeyboardMenu(true);
    
    // Désactiver les raccourcis clavier globaux quand le clavier virtuel est ouvert
    if (type === 'virtual') {
      try {
        await ipcRenderer.invoke('disable-keyboard-shortcuts');
        // Ajouter un intercepteur d'événements clavier au niveau du document
        document.addEventListener('keydown', handleVirtualKeyboardKeyDown, true);
      } catch (error) {
        console.error('Erreur lors de la désactivation des raccourcis:', error);
      }
    }
  };

  const handleCloseKeyboardMenu = async () => {
    setShowKeyboardMenu(false);
    
    // Réactiver les raccourcis clavier globaux quand le clavier virtuel est fermé
    if (keyboardMenuType === 'virtual') {
      try {
        await ipcRenderer.invoke('enable-keyboard-shortcuts');
        // Supprimer l'intercepteur d'événements clavier
        document.removeEventListener('keydown', handleVirtualKeyboardKeyDown, true);
      } catch (error) {
        console.error('Erreur lors de la réactivation des raccourcis:', error);
      }
    }
  };

  // Intercepteur d'événements clavier pour le clavier virtuel
  const handleVirtualKeyboardKeyDown = (event: KeyboardEvent) => {
    // Bloquer les raccourcis qui interfèrent avec le clavier virtuel
    const isF12 = event.key === 'F12';
    const isCtrlShiftI = event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i';
    const isCtrlShiftJ = event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'j';
    
    // Ne bloquer que les raccourcis qui interfèrent vraiment
    if (isF12 || isCtrlShiftI || isCtrlShiftJ) {
      console.log(`🚫 Raccourci intégré bloqué au niveau renderer: ${event.key}`);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
    
    // Pour Ctrl+C, Ctrl+X, Ctrl+V, on les laisse passer car ils sont utilisés dans le clavier virtuel
    // Le menu est déjà désactivé, donc ils ne déclencheront pas les actions de menu
  };

  // Effet pour pré-remplir les formulaires lors de l'édition d'une action
  useEffect(() => {
    if (editingAction) {
      // Déterminer le type d'action et pré-remplir les formulaires
      switch (editingAction.type) {
        case 'click':
          setSelectedAction('mouse');
          const clickValue = editingAction.value as number || 1;
          const clickType = clickValue === 1 ? 'simple' : clickValue === 2 ? 'double' : 'triple';
          setMouseConfig({
            clickType: clickType as any,
            buttonType: editingAction.target as any || 'left',
            position: editingAction.coordinates
          });
          break;
        case 'keypress':
        case 'type':
          setSelectedAction('keyboard');
          if (editingAction.type === 'type') {
            setKeyboardConfig({
              actionType: 'type',
              text: editingAction.value as string || '',
              modifiers: [],
              key: ''
            });
          } else {
            // Pour keypress, on va essayer de décomposer la combinaison
            const keyValue = editingAction.value as string || '';
            setKeyboardConfig({
              actionType: 'keypress',
              text: '',
              modifiers: keyValue.split('+').filter(k => ['Ctrl', 'Alt', 'Shift', 'Win'].includes(k)),
              key: keyValue
            });
          }
          break;
        case 'wait':
          setSelectedAction('system');
          setSystemConfig({
            actionType: 'wait',
            delay: editingAction.delay || 1000,
            position: undefined,
            direction: 'up',
            amount: 3
          });
          break;
        case 'move':
          setSelectedAction('system');
          setSystemConfig({
            actionType: 'move',
            delay: 1000,
            position: editingAction.coordinates,
            direction: 'up',
            amount: 3
          });
          break;
        case 'scroll':
          setSelectedAction('system');
          setSystemConfig({
            actionType: 'scroll',
            delay: 1000,
            position: undefined,
            direction: editingAction.target as any || 'up',
            amount: editingAction.value as number || 3
          });
          break;
      }
    }
  }, [editingAction]);

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
      
      // Annuler la capture de position si elle est en cours
      if (isCapturingPosition) {
        handleCancelCapture();
      }
      
      // Réactiver les raccourcis clavier si le clavier virtuel était ouvert
      if (showKeyboardMenu && keyboardMenuType === 'virtual') {
        ipcRenderer.invoke('enable-keyboard-shortcuts').catch((error: any) => {
          console.error('Erreur lors de la réactivation des raccourcis:', error);
        });
        // Supprimer l'intercepteur d'événements clavier
        document.removeEventListener('keydown', handleVirtualKeyboardKeyDown, true);
      }
      setShowKeyboardMenu(false);
    }
  }, [isVisible, showKeyboardMenu, keyboardMenuType, isCapturingPosition]);

  if (!isVisible) return null;

  return (
    <>
      <div className="action-sidebar-overlay" onClick={onClose} />
      
      <div className="action-sidebar">
        <div className="action-sidebar-header">
          <button className="hamburger-menu-btn" title="Menu des actions">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
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
              className="compact-action-btn integration-action"
              onClick={() => setSelectedAction('integration')}
              title="Intégrer des macros branche"
            >
              <div className="compact-icon">🔗</div>
              <div className="compact-title">Intégrations</div>
              <div className="compact-subtitle">Intégrer des macros branche</div>
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
                {editingAction ? 'Modifier l\'action' : 'Nouvelle action'} - {
                  selectedAction === 'mouse' && 'Configuration du clic de souris'
                }
                {selectedAction === 'keyboard' && 'Actions de clavier'}
                {selectedAction === 'system' && 'Actions système'}
                {selectedAction === 'integration' && 'Intégrations de macros'}
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
                        
                        <div className="capture-controls">
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
                            {isCapturingPosition ? '🎯 Cliquez n\'importe où...' : '📸 Capturer position'}
                          </button>
                          {isCapturingPosition && (
                            <button 
                              className="cancel-capture-btn"
                              onClick={handleCancelCapture}
                              title="Annuler la capture"
                            >
                              ✕ Annuler
                            </button>
                          )}
                        </div>
                        {isCapturingPosition && (
                          <p className="capture-instruction">
                            🎯 <strong>Mode capture activé</strong> - Cliquez n'importe où sur votre écran pour capturer la position
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bouton d'ajout */}
                    <div className="config-section-compact">
                      <button 
                        className="add-action-btn"
                        onClick={handleAddMouseAction}
                        disabled={!mouseConfig.clickType || !mouseConfig.buttonType}
                      >
                        {editingAction ? '✓ Modifier cette action' : '+ Ajouter cette action'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedAction === 'keyboard' && (
                <div className="keyboard-config">
                  <h4>Configuration des touches</h4>
                  
                  <div className="keyboard-options">
                    <div className="keyboard-option">
                      <h5>Saisie de texte</h5>
                      <p>Entrer du texte à taper automatiquement</p>
                      <button 
                        className="config-btn"
                        onClick={() => handleOpenKeyboardMenu('text')}
                      >
                        Ouvrir l'éditeur de texte
                      </button>
                    </div>
                    
                    <div className="keyboard-option">
                      <h5>Clavier virtuel</h5>
                      <p>Sélectionner des touches et combinaisons</p>
                      <button 
                        className="config-btn"
                        onClick={() => handleOpenKeyboardMenu('virtual')}
                      >
                        Ouvrir le clavier virtuel
                      </button>
                    </div>
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
                        disabled={editingAction ? editingAction.type !== 'wait' : false}
                      >
                        Attendre
                      </button>
                      <button 
                        className={`config-btn ${systemConfig.actionType === 'move' ? 'active' : ''}`}
                        onClick={() => setSystemConfig(prev => ({ ...prev, actionType: 'move' }))}
                        disabled={editingAction ? editingAction.type !== 'move' : false}
                      >
                        Déplacer curseur
                      </button>
                      <button 
                        className={`config-btn ${systemConfig.actionType === 'scroll' ? 'active' : ''}`}
                        onClick={() => setSystemConfig(prev => ({ ...prev, actionType: 'scroll' }))}
                        disabled={editingAction ? editingAction.type !== 'scroll' : false}
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
                        
                        <div className="capture-controls">
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
                            {isCapturingPosition ? '🎯 Cliquez n\'importe où...' : '📸 Capturer la position'}
                          </button>
                          {isCapturingPosition && (
                            <button 
                              className="cancel-capture-btn"
                              onClick={handleCancelCapture}
                              title="Annuler la capture"
                            >
                              ✕ Annuler
                            </button>
                          )}
                        </div>
                        {isCapturingPosition && (
                          <p className="capture-instruction">
                            🎯 <strong>Mode capture activé</strong> - Cliquez n'importe où sur votre écran pour capturer la position
                          </p>
                        )}
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
                      {editingAction ? '✓ Modifier cette action' : '+ Ajouter cette action'}
                    </button>
                  </div>
                </div>
              )}

              {selectedAction === 'integration' && (
                <div className="integration-config">
                  <div className="config-section">
                    <h5>Intégrations de macros</h5>
                    <p>
                      Sélectionnez une macro de type <strong>branche</strong> à intégrer dans votre macro principale.
                      L'intégration sera automatiquement mise à jour avec la version actuelle de la macro.
                    </p>
                    
                    {currentProject && currentProject.macros.filter(m => m.type === 'branche' && m.actions.length > 0).length > 0 ? (
                      <div className="integration-list">
                        {currentProject.macros
                          .filter(macro => macro.type === 'branche' && macro.actions.length > 0)
                          .map((macro) => (
                            <div
                              key={macro.id}
                              className="integration-item"
                              onClick={() => {
                                const newAction: MacroAction = {
                                  id: editingAction?.id || `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                  type: 'integration',
                                  target: macro.name,
                                  value: macro.actions.length,
                                  description: `Intégration: ${macro.name}`,
                                  repeatCount: editingAction?.repeatCount || 1,
                                  integrationMacroId: macro.id,
                                  integrationMacroVersion: macro.version,
                                };

                                if (editingAction && onActionUpdate) {
                                  onActionUpdate(editingAction.id, newAction);
                                } else {
                                  onActionAdd(newAction);
                                }
                                setSelectedAction(null);
                              }}
                            >
                              <div className="integration-item-header">
                                <span className="integration-icon">🌿</span>
                                <h6>{macro.name}</h6>
                              </div>
                              {macro.description && (
                                <p className="integration-description">{macro.description}</p>
                              )}
                              <div className="integration-stats">
                                <span>{macro.actions.length} action{macro.actions.length !== 1 ? 's' : ''}</span>
                                <span>Version {macro.version}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="no-integrations">
                        <span className="no-integrations-icon">🌿</span>
                        <h6>Aucune macro branche disponible</h6>
                        <p>Créez d'abord des macros de type "branche" pour pouvoir les intégrer.</p>
                      </div>
                    )}
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

      {/* Modal du clavier virtuel */}
      {showKeyboardMenu && (
        <div className="keyboard-modal-overlay" onClick={handleCloseKeyboardMenu}>
          <div className="keyboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="keyboard-modal-header">
              <h3>
                {keyboardMenuType === 'text' ? 'Saisie de texte' : 'Clavier virtuel'}
              </h3>
              <button className="close-btn" onClick={handleCloseKeyboardMenu}>✕</button>
            </div>
            
            <div className="keyboard-modal-content">
              {keyboardMenuType === 'text' ? (
                <div className="text-input-section">
                  <h4>Entrez le texte à saisir :</h4>
                  <textarea
                    className="text-input"
                    placeholder="Tapez votre texte ici..."
                    rows={6}
                    value={keyboardConfig.text}
                    onChange={(e) => setKeyboardConfig(prev => ({ ...prev, text: e.target.value }))}
                  />
                  <div className="keyboard-modal-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setKeyboardConfig(prev => ({ ...prev, text: '' }))}
                    >
                      Effacer
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        if (keyboardConfig.text.trim()) {
                          handleAddKeyboardAction();
                          handleCloseKeyboardMenu();
                        }
                      }}
                      disabled={!keyboardConfig.text.trim()}
                    >
                      {editingAction ? 'Modifier l\'action' : 'Ajouter l\'action'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="virtual-keyboard-section">
                  <h4>Clavier virtuel miniature</h4>
                  <p className="instruction">Cliquez sur les touches que vous voulez actionner simultanément :</p>
                  
                  <div className="virtual-keyboard">
                    {[
                      ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
                      ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
                      ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
                      ['CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
                      ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
                      ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Menu', 'Ctrl'],
                      ['Insert', 'Home', 'PageUp', '', 'Up', '', 'Delete', 'End', 'PageDown'],
                      ['', 'Left', 'Down', 'Right']
                    ].map((row, rowIndex) => (
                      <div key={rowIndex} className="keyboard-row">
                        {row.map((key, keyIndex) => {
                          // Ignorer les cellules vides
                          if (!key) {
                            return <div key={`empty-${keyIndex}`} className="keyboard-empty-cell"></div>;
                          }
                          
                          return (
                            <button
                              key={key}
                              className={`virtual-key ${keyboardConfig.modifiers.includes(key) ? 'selected' : ''} ${
                                ['Shift', 'Ctrl', 'Alt', 'Win'].includes(key) ? 'modifier-key' : ''
                              } ${['Space'].includes(key) ? 'space-key' : ''} ${
                                ['Enter', 'Backspace', 'Tab'].includes(key) ? 'special-key' : ''
                              } ${key.startsWith('F') && key.length <= 3 ? 'function-key' : ''} ${
                                ['Up', 'Down', 'Left', 'Right', 'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete'].includes(key) ? 'arrow-key' : ''
                              }`}
                              onClick={() => {
                                const newModifiers = keyboardConfig.modifiers.includes(key)
                                  ? keyboardConfig.modifiers.filter(k => k !== key)
                                  : [...keyboardConfig.modifiers, key];
                                setKeyboardConfig(prev => ({ ...prev, modifiers: newModifiers }));
                              }}
                              title={`${keyboardConfig.modifiers.includes(key) ? 'Désélectionner' : 'Sélectionner'} ${key}`}
                            >
                              {key === 'Space' ? '⎵' : 
                               key === 'Up' ? '↑' :
                               key === 'Down' ? '↓' :
                               key === 'Left' ? '←' :
                               key === 'Right' ? '→' :
                               key === 'PageUp' ? 'PgUp' :
                               key === 'PageDown' ? 'PgDn' :
                               key}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {keyboardConfig.modifiers.length > 0 && (
                    <div className="selected-keys-preview">
                      <h5>Touches sélectionnées :</h5>
                      <div className="selected-keys-list">
                        {keyboardConfig.modifiers.map((key) => (
                          <span key={key} className="selected-key-tag">
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="keyboard-modal-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setKeyboardConfig(prev => ({ ...prev, modifiers: [] }))}
                      disabled={keyboardConfig.modifiers.length === 0}
                    >
                      Effacer sélection
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        if (keyboardConfig.modifiers.length > 0) {
                          handleAddKeyboardAction();
                          handleCloseKeyboardMenu();
                        }
                      }}
                      disabled={keyboardConfig.modifiers.length === 0}
                    >
                      {editingAction ? 'Modifier la combinaison' : 'Ajouter la combinaison'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionSidebar;

