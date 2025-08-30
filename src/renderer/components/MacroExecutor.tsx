import React, { useState, useEffect } from 'react';
import { Macro, MacroAction } from '../../types/macro';
import './MacroExecutor.css';

const { ipcRenderer } = window.require('electron');

interface MacroExecutorProps {
  macro: Macro;
  onComplete: () => void;
  onStop: () => void;
}

const MacroExecutor: React.FC<MacroExecutorProps> = ({ macro, onComplete, onStop }) => {
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [progress, setProgress] = useState(0);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  useEffect(() => {
    if (!isRunning) return;

    const executeAction = async (action: MacroAction) => {
      const actionDescription = getActionDescription(action);
      setExecutionLog(prev => [...prev, `Exécution: ${actionDescription}`]);

      try {
        // Préparer la payload pour l'action système
        const actionPayload = {
          type: action.type,
          coordinates: action.coordinates,
          value: action.value,
          delay: action.delay,
          button: (action as any).button || 'left',
          clickCount: action.type === 'click' ? (action.value as number) || 1 : 1,
        };

        // Exécuter l'action réelle via IPC
        const result = await ipcRenderer.invoke('execute-system-action', actionPayload);
        
        if (!result.success) {
          throw new Error(result.error || 'Erreur inconnue lors de l\'exécution');
        }

        setExecutionLog(prev => [...prev, `✓ Terminé: ${actionDescription}`]);

        // SUPPRIMÉ: Pas de délai supplémentaire ici
        // Le délai est déjà géré dans l'action système si nécessaire

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setExecutionLog(prev => [...prev, `❌ Erreur: ${errorMessage}`]);
        throw error; // Re-lancer l'erreur pour arrêter l'exécution
      }
    };

    const runMacro = async () => {
      for (let i = 0; i < macro.actions.length; i++) {
        if (!isRunning) break;

        setCurrentActionIndex(i);
        setProgress((i / macro.actions.length) * 100);

        try {
          await executeAction(macro.actions[i]);
        } catch (error) {
          setExecutionLog(prev => [...prev, `❌ Erreur: ${error}`]);
          break;
        }
      }

      if (isRunning) {
        setProgress(100);
        setExecutionLog(prev => [...prev, '🎉 Macro terminée avec succès!']);
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    };

    runMacro();
  }, [macro, isRunning, onComplete]);

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

  const handleStop = () => {
    setIsRunning(false);
    setExecutionLog(prev => [...prev, '⏹ Exécution arrêtée par l\'utilisateur']);
    onStop();
  };

  const currentAction = macro.actions[currentActionIndex];

  return (
    <div className="macro-executor-overlay" style={{ pointerEvents: 'none', zIndex: -1 }}>
      <div className="macro-executor" style={{ opacity: 0.1, pointerEvents: 'none' }}>
        <div className="executor-header">
          <h3>Exécution de la macro</h3>
          <button className="btn btn-sm btn-danger" onClick={handleStop} style={{ pointerEvents: 'auto' }}>
            <span className="icon">⏹</span>
            Arrêter
          </button>
        </div>

        <div className="executor-content">
          <div className="macro-info">
            <h4>{macro.name}</h4>
            {macro.description && <p>{macro.description}</p>}
          </div>

          <div className="progress-section">
            <div className="progress-info">
              <span>Action {currentActionIndex + 1} sur {macro.actions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {currentAction && (
            <div className="current-action">
              <h5>Action en cours:</h5>
              <div className="action-display">
                <span className="action-icon">
                  {currentAction.type === 'click' && '👆'}
                  {currentAction.type === 'keypress' && '⌨️'}
                  {currentAction.type === 'type' && '📝'}
                  {currentAction.type === 'wait' && '⏱️'}
                  {currentAction.type === 'move' && '🖱️'}
                  {currentAction.type === 'scroll' && '📜'}
                </span>
                <span className="action-text">
                  {getActionDescription(currentAction)}
                </span>
              </div>
            </div>
          )}

          <div className="execution-log">
            <h5>Journal d'exécution:</h5>
            <div className="log-content">
              {executionLog.map((logEntry, index) => (
                <div key={index} className="log-entry">
                  {logEntry}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroExecutor;
