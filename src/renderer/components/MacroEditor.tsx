import React, { useState } from 'react';
import { Macro, MacroAction } from '../../types/macro';
import DelayModal from './DelayModal';
import './MacroEditor.css';

interface MacroEditorProps {
  macro: Macro;
  onMacroUpdate: (macro: Macro) => void;
  isRecording: boolean;
  isExecuting: boolean;
  onMacroTest?: (macro: Macro) => void;
  onMacroSave?: (macro: Macro) => void;
  onOpenActionLibrary?: () => void;
  onEditAction?: (action: MacroAction) => void;
}

const MacroEditor: React.FC<MacroEditorProps> = ({
  macro,
  onMacroUpdate,
  isRecording,
  isExecuting,
  onMacroTest,
  onMacroSave,
  onOpenActionLibrary,
  onEditAction,
}) => {
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState<boolean>(false);

  const handleNameChange = (name: string) => {
    onMacroUpdate({
      ...macro,
      name,
      modifiedAt: new Date(),
    });
  };



  const handleActionUpdate = (actionId: string, updatedAction: MacroAction) => {
    const updatedActions = macro.actions.map(action =>
      action.id === actionId ? updatedAction : action
    );

    onMacroUpdate({
      ...macro,
      actions: updatedActions,
      modifiedAt: new Date(),
    });
    setEditingAction(null);
  };

  const handleActionDelete = (actionId: string) => {
    const updatedActions = macro.actions.filter(action => action.id !== actionId);
    
    onMacroUpdate({
      ...macro,
      actions: updatedActions,
      modifiedAt: new Date(),
    });
  };

  const handleActionMove = (fromIndex: number, toIndex: number) => {
    const updatedActions = [...macro.actions];
    const [movedAction] = updatedActions.splice(fromIndex, 1);
    updatedActions.splice(toIndex, 0, movedAction);

    onMacroUpdate({
      ...macro,
      actions: updatedActions,
      modifiedAt: new Date(),
    });
  };

  const handleAddDelay = (delay: number) => {
    const newAction: MacroAction = {
      id: `delay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'wait',
      delay: delay,
      description: `Attendre ${delay}ms`,
    };

    const updatedActions = [...macro.actions, newAction];
    
    onMacroUpdate({
      ...macro,
      actions: updatedActions,
      modifiedAt: new Date(),
    });
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'click': return '👆';
      case 'keypress': return '⌨️';
      case 'type': return '📝';
      case 'wait': return '⏱️';
      case 'move': return '🖱️';
      case 'scroll': return '📜';
      default: return '⚙️';
    }
  };

  const getActionDescription = (action: MacroAction) => {
    switch (action.type) {
      case 'click':
        const clickCount = action.value as number || 1;
        const clickType = clickCount === 1 ? 'Clic' : clickCount === 2 ? 'Double-clic' : clickCount === 3 ? 'Triple-clic' : `${clickCount}-clic`;
        return `${clickType} ${action.coordinates ? `en (${action.coordinates.x}, ${action.coordinates.y})` : ''}`;
      case 'keypress':
        return `Appuyer sur ${action.value}`;
      case 'type':
        return `Saisir "${action.value}"`;
      case 'wait':
        return `Attendre ${action.delay}ms`;
      case 'move':
        return `Déplacer vers (${action.coordinates?.x}, ${action.coordinates?.y})`;
      case 'scroll':
        return `Faire défiler ${action.value}`;
      default:
        return action.description || 'Action personnalisée';
    }
  };

  return (
    <div className="macro-editor">
      <div className="editor-header">
        <div className="macro-header-line">
          <div className="macro-title-section">
            <div className="macro-type-badge">
              <span className={`type-icon ${macro.type === 'main' ? 'main-type' : 'branche-type'}`}>
                {macro.type === 'main' ? '🎯' : '🌿'}
              </span>
            </div>
            <input
              type="text"
              className="macro-title-compact"
              value={macro.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nom de la macro"
              disabled={isExecuting}
            />
          </div>
          <div className="macro-header-actions">
            <button
              className="btn btn-sm btn-test"
              onClick={() => onMacroTest && onMacroTest(macro)}
              disabled={isExecuting || macro.actions.length === 0}
              title="Tester cette macro"
            >
              <span className="icon">🧪</span>
              Tester
            </button>
            <button
              className="btn btn-sm btn-save"
              onClick={() => onMacroSave && onMacroSave(macro)}
              disabled={isExecuting}
              title="Sauvegarder cette macro"
            >
              <span className="icon">💾</span>
              Sauvegarder
            </button>
          </div>
          <div className="macro-stats-compact">
            <span className="stat-compact">
              <strong>{macro.actions.length}</strong> action{macro.actions.length !== 1 ? 's' : ''}
            </span>
            <span className="stat-compact">
              Créée: <strong>{new Date(macro.createdAt).toLocaleDateString()}</strong>
            </span>
            <span className="stat-compact">
              Modifiée: <strong>{new Date(macro.modifiedAt).toLocaleDateString()}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="actions-container">
        <div className="actions-header">
          <h3>Actions</h3>
          <div className="actions-header-controls">
            {!isRecording && !isExecuting && (
              <>
                <button
                  className="btn btn-sm btn-add-delay"
                  onClick={() => setIsDelayModalOpen(true)}
                  title="Ajouter un délai"
                >
                  <span className="icon">⏱️</span>
                  Ajouter un délai
                </button>
                <button
                  className="btn btn-sm btn-action-library"
                  onClick={() => onOpenActionLibrary && onOpenActionLibrary()}
                  title="Ouvrir la bibliothèque d'actions"
                >
                  <span className="icon">⚙️</span>
                  Actions
                </button>
              </>
            )}
            {isRecording && (
              <div className="recording-hint">
                <span className="recording-dot"></span>
                Les actions seront ajoutées automatiquement pendant l'enregistrement
              </div>
            )}
          </div>
        </div>

        <div className="actions-list">
          {macro.actions.length === 0 ? (
            <div className="no-actions">
              <span className="no-actions-icon">🎬</span>
              <h4>Aucune action</h4>
              <p>
                {isRecording 
                  ? "Effectuez des actions dans votre système pour les enregistrer automatiquement."
                  : "Ajoutez des actions depuis la bibliothèque ou commencez un enregistrement."
                }
              </p>
            </div>
          ) : (
            macro.actions.map((action, index) => (
              <div
                key={action.id}
                className={`action-item ${editingAction === action.id ? 'editing' : ''}`}
              >
                <div className="action-number">{index + 1}</div>
                
                <div className="action-content">
                  <div className="action-header">
                    <span className="action-icon">{getActionIcon(action.type)}</span>
                    <span className="action-type">{action.type.toUpperCase()}</span>
                    <span className="action-description">
                      {getActionDescription(action)}
                    </span>
                  </div>
                  
                  {action.delay && action.delay > 0 && (
                    <div className="action-delay">
                      Délai: {action.delay}ms
                    </div>
                  )}
                </div>
                
                <div className="action-controls">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      if (onEditAction) {
                        onEditAction(action);
                      }
                    }}
                    disabled={isExecuting || isRecording}
                    title="Modifier cette action"
                  >
                    ✏️
                  </button>
                  
                  <div className="move-controls">
                    <button
                      className="btn btn-sm"
                      onClick={() => handleActionMove(index, index - 1)}
                      disabled={index === 0 || isExecuting || isRecording}
                      title="Déplacer vers le haut"
                    >
                      ⬆️
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleActionMove(index, index + 1)}
                      disabled={index === macro.actions.length - 1 || isExecuting || isRecording}
                      title="Déplacer vers le bas"
                    >
                      ⬇️
                    </button>
                  </div>
                  
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleActionDelete(action.id)}
                    disabled={isExecuting || isRecording}
                    title="Supprimer cette action"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <DelayModal
        isOpen={isDelayModalOpen}
        onClose={() => setIsDelayModalOpen(false)}
        onConfirm={handleAddDelay}
      />
    </div>
  );
};

export default MacroEditor;
