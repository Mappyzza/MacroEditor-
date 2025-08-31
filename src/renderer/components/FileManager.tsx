import React, { useState } from 'react';
import { MacroProject } from '../../types/macro';
import './FileManager.css';

const { ipcRenderer } = window.require('electron');

interface FileManagerProps {
  currentProject: MacroProject | null;
  onProjectLoad: (project: MacroProject) => void;
  onProjectSave: (project: MacroProject) => void;
  onNewProject: () => void;
  isVisible: boolean;
  onClose: () => void;
}

const FileManager: React.FC<FileManagerProps> = ({
  currentProject,
  onProjectLoad,
  onProjectSave,
  onNewProject,
  isVisible,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewFile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await ipcRenderer.invoke('show-save-dialog', {
        title: 'Créer un nouveau fichier de macros',
        defaultPath: 'nouveau_projet_macros.json',
        filters: [
          { name: 'Fichiers de macros', extensions: ['json'] },
          { name: 'Tous les fichiers', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        const newProject: MacroProject = {
          id: `project-${Date.now()}`,
          name: 'Nouveau Projet',
          description: 'Projet de macros vide',
          macros: [],
          createdAt: new Date(),
          modifiedAt: new Date(),
          filePath: result.filePath,
          fileName: result.filePath.split(/[\\/]/).pop() || 'nouveau_projet_macros.json'
        };

        // Sauvegarder le fichier vide
        await ipcRenderer.invoke('save-macro', {
          filePath: result.filePath,
          content: newProject
        });

        onProjectLoad(newProject);
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la création du fichier:', error);
      setError('Erreur lors de la création du fichier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await ipcRenderer.invoke('show-open-dialog', {
        title: 'Ouvrir un fichier de macros',
        filters: [
          { name: 'Fichiers de macros', extensions: ['json'] },
          { name: 'Tous les fichiers', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const projectData = await ipcRenderer.invoke('load-macro', filePath);
        
        if (projectData) {
          const project: MacroProject = {
            ...projectData,
            filePath: filePath,
            fileName: filePath.split(/[\\/]/).pop() || 'projet_macros.json',
            createdAt: new Date(projectData.createdAt),
            modifiedAt: new Date(projectData.modifiedAt),
            macros: projectData.macros.map((macro: any) => ({
              ...macro,
              createdAt: new Date(macro.createdAt),
              modifiedAt: new Date(macro.modifiedAt)
            }))
          };
          
          onProjectLoad(project);
          onClose();
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du fichier:', error);
      setError('Erreur lors de l\'ouverture du fichier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!currentProject) return;

    try {
      setIsLoading(true);
      setError(null);
      
      if (currentProject.filePath) {
        // Sauvegarder dans le fichier existant
        await ipcRenderer.invoke('save-macro', {
          filePath: currentProject.filePath,
          content: currentProject
        });
        onProjectSave(currentProject);
      } else {
        // Demander un nouveau nom de fichier
        const result = await ipcRenderer.invoke('show-save-dialog', {
          title: 'Sauvegarder le projet de macros',
          defaultPath: `${currentProject.name || 'projet_macros'}.json`,
          filters: [
            { name: 'Fichiers de macros', extensions: ['json'] },
            { name: 'Tous les fichiers', extensions: ['*'] }
          ]
        });

        if (!result.canceled && result.filePath) {
          const updatedProject = {
            ...currentProject,
            filePath: result.filePath,
            fileName: result.filePath.split(/[\\/]/).pop() || 'projet_macros.json',
            modifiedAt: new Date()
          };

          await ipcRenderer.invoke('save-macro', {
            filePath: result.filePath,
            content: updatedProject
          });
          
          onProjectLoad(updatedProject);
        }
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsFile = async () => {
    if (!currentProject) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await ipcRenderer.invoke('show-save-dialog', {
        title: 'Sauvegarder sous...',
        defaultPath: `${currentProject.name || 'projet_macros'}.json`,
        filters: [
          { name: 'Fichiers de macros', extensions: ['json'] },
          { name: 'Tous les fichiers', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        const updatedProject = {
          ...currentProject,
          filePath: result.filePath,
          fileName: result.filePath.split(/[\\/]/).pop() || 'projet_macros.json',
          modifiedAt: new Date()
        };

        await ipcRenderer.invoke('save-macro', {
          filePath: result.filePath,
          content: updatedProject
        });
        
        onProjectLoad(updatedProject);
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde sous:', error);
      setError('Erreur lors de la sauvegarde sous');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="file-manager-overlay" onClick={onClose} />
      <div className="file-manager-modal">
        <div className="file-manager-header">
          <h3>Gestion des fichiers</h3>
          <button className="close-btn" onClick={onClose} title="Fermer">
            ✕
          </button>
        </div>

        <div className="file-manager-content">
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <div className="file-info">
            {currentProject ? (
              <div className="current-file-info">
                <h4>Fichier actuel :</h4>
                <p><strong>Nom :</strong> {currentProject.fileName || 'Non sauvegardé'}</p>
                <p><strong>Projet :</strong> {currentProject.name}</p>
                <p><strong>Macros :</strong> {currentProject.macros.length}</p>
                <p><strong>Dernière modification :</strong> {currentProject.modifiedAt.toLocaleString()}</p>
              </div>
            ) : (
              <div className="no-file-info">
                <p>Aucun fichier ouvert</p>
              </div>
            )}
          </div>

          <div className="file-actions">
            <button 
              className="file-action-btn new-file"
              onClick={handleNewFile}
              disabled={isLoading}
            >
              📄 Nouveau fichier
            </button>

            <button 
              className="file-action-btn open-file"
              onClick={handleOpenFile}
              disabled={isLoading}
            >
              📂 Ouvrir fichier
            </button>

            <button 
              className="file-action-btn save-file"
              onClick={handleSaveFile}
              disabled={isLoading || !currentProject}
            >
              💾 Sauvegarder
            </button>

            <button 
              className="file-action-btn save-as-file"
              onClick={handleSaveAsFile}
              disabled={isLoading || !currentProject}
            >
              💾 Sauvegarder sous...
            </button>

            <button 
              className="file-action-btn new-project"
              onClick={() => {
                onNewProject();
                onClose();
              }}
              disabled={isLoading}
            >
              🆕 Nouveau projet (mémoire)
            </button>
          </div>

          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Chargement...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FileManager;
