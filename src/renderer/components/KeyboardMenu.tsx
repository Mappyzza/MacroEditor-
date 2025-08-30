import React, { useState } from 'react';
import { MacroAction } from '../../types/macro';
import './KeyboardMenu.css';

interface KeyboardMenuProps {
  onActionAdd: (action: MacroAction) => void;
  onClose: () => void;
}

const KeyboardMenu: React.FC<KeyboardMenuProps> = ({ onActionAdd, onClose }) => {
  const [activeTab, setActiveTab] = useState<'simple' | 'combinaison'>('simple');
  const [simpleText, setSimpleText] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Disposition du clavier miniature
  const keyboardLayout = [
    ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Menu', 'Ctrl']
  ];

  // Touches spéciales avec leurs codes pour AutoHotkey/nircmd/PowerShell
  const specialKeys = {
    // Touches de fonction
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
    
    // Touches spéciales
    'Esc': '{ESC}',
    'Tab': '{TAB}',
    'CapsLock': '{CAPSLOCK}',
    'Enter': '{ENTER}',
    'Backspace': '{BACKSPACE}',
    'Space': ' ',
    'Menu': '{APPSKEY}',
    
    // Modificateurs (pour AutoHotkey, format différent en combinaison)
    'Shift': '{SHIFT}',
    'Ctrl': '{CTRL}',
    'Alt': '{ALT}',
    'Win': '{LWIN}'
  };

  const handleKeyClick = (key: string) => {
    const newSelectedKeys = new Set(selectedKeys);
    
    if (newSelectedKeys.has(key)) {
      newSelectedKeys.delete(key);
    } else {
      newSelectedKeys.add(key);
    }
    
    setSelectedKeys(newSelectedKeys);
  };

  const handleAddSimpleAction = () => {
    if (!simpleText.trim()) return;

    const action: MacroAction = {
      id: `action-${Date.now()}`,
      type: 'type',
      value: simpleText,
      description: `Saisir "${simpleText}"`
    };

    onActionAdd(action);
    setSimpleText('');
  };

  const handleAddCombinationAction = () => {
    if (selectedKeys.size === 0) return;

    const keysArray = Array.from(selectedKeys);
    let combinationString = '';
    
    // Séparer les modificateurs des autres touches
    const modifiers = keysArray.filter(key => ['Ctrl', 'Alt', 'Shift', 'Win'].includes(key));
    const otherKeys = keysArray.filter(key => !['Ctrl', 'Alt', 'Shift', 'Win'].includes(key));
    
    if (keysArray.length === 1) {
      // Une seule touche
      const key = keysArray[0];
      if (specialKeys[key as keyof typeof specialKeys]) {
        combinationString = specialKeys[key as keyof typeof specialKeys];
      } else if (key.length === 1 && /^[A-Z]$/.test(key)) {
        combinationString = key.toLowerCase();
      } else {
        combinationString = key;
      }
    } else {
      // Combinaison de touches - utiliser la syntaxe AutoHotkey
      if (modifiers.length > 0 && otherKeys.length > 0) {
        // Format: ^a (Ctrl+A), !{F4} (Alt+F4), etc.
        let modifierPrefix = '';
        if (modifiers.includes('Ctrl')) modifierPrefix += '^';
        if (modifiers.includes('Alt')) modifierPrefix += '!';
        if (modifiers.includes('Shift')) modifierPrefix += '+';
        if (modifiers.includes('Win')) modifierPrefix += '#';
        
        // Prendre la première touche non-modificateur
        const mainKey = otherKeys[0];
        let keyCode = '';
        
        if (specialKeys[mainKey as keyof typeof specialKeys]) {
          keyCode = specialKeys[mainKey as keyof typeof specialKeys];
        } else if (mainKey.length === 1 && /^[A-Z]$/.test(mainKey)) {
          keyCode = mainKey.toLowerCase();
        } else {
          keyCode = mainKey;
        }
        
        combinationString = modifierPrefix + keyCode;
      } else {
        // Pas de modificateurs, juste des touches multiples
        combinationString = keysArray
          .map(key => {
            if (specialKeys[key as keyof typeof specialKeys]) {
              return specialKeys[key as keyof typeof specialKeys];
            } else if (key.length === 1 && /^[A-Z]$/.test(key)) {
              return key.toLowerCase();
            }
            return key;
          })
          .join('');
      }
    }

    const action: MacroAction = {
      id: `action-${Date.now()}`,
      type: 'keypress',
      value: combinationString,
      description: `Combinaison de touches: ${keysArray.join(' + ')}`
    };

    onActionAdd(action);
    setSelectedKeys(new Set());
  };

  const getKeyClass = (key: string) => {
    let className = 'virtual-key';
    
    // Ajouter des classes spéciales pour certaines touches
    if (['Shift', 'Ctrl', 'Alt', 'Win'].includes(key)) {
      className += ' modifier-key';
    } else if (['Space'].includes(key)) {
      className += ' space-key';
    } else if (['Enter', 'Backspace', 'Tab'].includes(key)) {
      className += ' special-key';
    } else if (key.startsWith('F') && key.length <= 3) {
      className += ' function-key';
    }
    
    // Ajouter la classe de sélection
    if (selectedKeys.has(key)) {
      className += ' selected';
    }
    
    return className;
  };

  const clearSelection = () => {
    setSelectedKeys(new Set());
  };

  return (
    <div className="keyboard-menu-wrapper" onClick={onClose}>
      <div className="keyboard-menu" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-menu-header">
          <h3>Menu Touches</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === 'simple' ? 'active' : ''}`}
          onClick={() => setActiveTab('simple')}
        >
          Simples
        </button>
        <button
          className={`tab-btn ${activeTab === 'combinaison' ? 'active' : ''}`}
          onClick={() => setActiveTab('combinaison')}
        >
          Combinaisons
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'simple' && (
          <div className="simple-tab">
            <h4>Saisie de texte simple</h4>
            <div className="simple-input-group">
              <label htmlFor="simple-text">Texte à saisir :</label>
              <textarea
                id="simple-text"
                className="form-control"
                value={simpleText}
                onChange={(e) => setSimpleText(e.target.value)}
                placeholder="Entrez le texte à saisir..."
                rows={3}
              />
            </div>
            <div className="action-buttons">
              <button
                className="btn btn-primary"
                onClick={handleAddSimpleAction}
                disabled={!simpleText.trim()}
              >
                Ajouter l'action
              </button>
            </div>
          </div>
        )}

        {activeTab === 'combinaison' && (
          <div className="combination-tab">
            <h4>Clavier virtuel miniature</h4>
            <p className="instruction">Cliquez sur les touches que vous voulez actionner simultanément :</p>
            
            <div className="virtual-keyboard">
              {keyboardLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                  {row.map((key) => (
                    <button
                      key={key}
                      className={getKeyClass(key)}
                      onClick={() => handleKeyClick(key)}
                      title={`${selectedKeys.has(key) ? 'Désélectionner' : 'Sélectionner'} ${key}`}
                    >
                      {key === 'Space' ? '⎵' : key}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {selectedKeys.size > 0 && (
              <div className="selected-keys-preview">
                <h5>Touches sélectionnées :</h5>
                <div className="selected-keys-list">
                  {Array.from(selectedKeys).map((key) => (
                    <span key={key} className="selected-key-tag">
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button
                className="btn btn-secondary"
                onClick={clearSelection}
                disabled={selectedKeys.size === 0}
              >
                Effacer sélection
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddCombinationAction}
                disabled={selectedKeys.size === 0}
              >
                Ajouter la combinaison
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default KeyboardMenu;
