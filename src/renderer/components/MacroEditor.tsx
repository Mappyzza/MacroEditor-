import React, { useState } from 'react';
import { Macro, MacroAction, MacroProject } from '../../types/macro';
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
  currentProject: MacroProject | null;
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
  currentProject,
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
      repeatCount: 1,
    };

    const updatedActions = [...macro.actions, newAction];
    
    onMacroUpdate({
      ...macro,
      actions: updatedActions,
      modifiedAt: new Date(),
    });
  };

  const handleSimulateAction = async (action: MacroAction) => {
    console.log('🎬 Simulation de l\'action:', action);
    
    try {
      // Gestion spéciale pour les intégrations
      if (action.type === 'integration') {
        if (!currentProject || !action.integrationMacroId) {
          throw new Error('Impossible de simuler l\'intégration : informations manquantes');
        }

        const integratedMacro = currentProject.macros.find(m => m.id === action.integrationMacroId);
        if (!integratedMacro) {
          throw new Error('Macro intégrée introuvable');
        }

        console.log('🔗 Simulation de l\'intégration:', integratedMacro.name);
        
        // Exécuter la macro intégrée
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('execute-macro', integratedMacro);
        
        if (!result) {
          throw new Error('Échec de l\'exécution de la macro intégrée');
        }

        console.log('✅ Intégration simulée avec succès');
        alert(`✅ Intégration simulée avec succès : ${integratedMacro.name}`);
        return;
      }

      // Pour les autres types d'actions
      const actionPayload = {
        type: action.type,
        coordinates: action.coordinates,
        value: action.value,
        delay: action.delay,
        button: (action as any).button || 'left',
        clickCount: action.type === 'click' ? (action.value as number) || 1 : 1,
        integrationMacroId: action.integrationMacroId,
        integrationMacroVersion: action.integrationMacroVersion,
        repeatCount: action.repeatCount || 1,
      };

      // Exécuter l'action réelle via IPC
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('execute-system-action', actionPayload);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue lors de la simulation');
      }

      console.log('✅ Action simulée avec succès');
      
      // Afficher une notification de succès
      const actionDescription = getActionDescription(action);
      alert(`✅ Action simulée avec succès : ${actionDescription}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la simulation:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`❌ Erreur lors de la simulation : ${errorMessage}`);
    }
  };



  const getActionIcon = (type: string) => {
    switch (type) {
      case 'click': return '👆';
      case 'keypress': return '⌨️';
      case 'type': return '📝';
      case 'wait': return '⏱️';
      case 'move': return '🖱️';
      case 'scroll': return '📜';
      case 'integration': return '🔗';
      default: return '⚙️';
    }
  };

  const getActionDescription = (action: MacroAction) => {
    let baseDescription = '';
    
    switch (action.type) {
      case 'click':
        const clickCount = action.value as number || 1;
        const clickType = clickCount === 1 ? 'Clic' : clickCount === 2 ? 'Double-clic' : clickCount === 3 ? 'Triple-clic' : `${clickCount}-clic`;
        baseDescription = `${clickType} ${action.coordinates ? `en (${action.coordinates.x}, ${action.coordinates.y})` : ''}`;
        break;
      case 'keypress':
        baseDescription = `Appuyer sur ${action.value}`;
        break;
      case 'type':
        baseDescription = `Saisir "${action.value}"`;
        break;
      case 'wait':
        baseDescription = `Attendre ${action.delay}ms`;
        break;
      case 'move':
        baseDescription = `Déplacer vers (${action.coordinates?.x}, ${action.coordinates?.y})`;
        break;
      case 'scroll':
        baseDescription = `Faire défiler ${action.value}`;
        break;
      case 'integration':
        const integratedMacro = currentProject?.macros.find(m => m.id === action.integrationMacroId);
        if (integratedMacro) {
          baseDescription = `Intégration: ${integratedMacro.name} (${integratedMacro.actions.length} actions)`;
          if (integratedMacro.version !== action.integrationMacroVersion) {
            baseDescription += ` [Mise à jour disponible: v${integratedMacro.version}]`;
          }
        } else {
          baseDescription = `Intégration: ${action.target} (Macro introuvable)`;
        }
        break;
      default:
        baseDescription = action.description || 'Action personnalisée';
    }
    
    // Ajouter le nombre de répétitions si différent de 1
    if (action.repeatCount && action.repeatCount > 1) {
      baseDescription += ` (×${action.repeatCount})`;
    }
    
    return baseDescription;
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
                  
                  <button
                    className="btn btn-sm btn-simulate"
                    onClick={() => handleSimulateAction(action)}
                    disabled={isExecuting || isRecording}
                    title="Simuler cette action"
                  >
                    ▶️
                  </button>
                  
                  <div className="repeat-control">
                    <label className="repeat-label" title="Nombre de répétitions">
                      ×
                    </label>
                    <input
                      type="number"
                      className="repeat-input"
                      value={action.repeatCount || 1}
                      onChange={(e) => {
                        const repeatCount = Math.max(1, parseInt(e.target.value) || 1);
                        const updatedAction = { ...action, repeatCount };
                        handleActionUpdate(action.id, updatedAction);
                      }}
                      min="1"
                      max="999"
                      disabled={isExecuting || isRecording}
                      title="Nombre de fois que cette action sera répétée"
                    />
                  </div>
                  
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
