import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MacroProject, Macro } from '../../types/macro';
import './Sidebar.css';

const { ipcRenderer } = window.require('electron');

interface SidebarProps {
  project: MacroProject | null;
  selectedMacro: Macro | null;
  onMacroSelect: (macro: Macro) => void;
  onMacroDelete: (macroId: string) => void;
  onNewMacro: () => void;
  onNewProject: () => void;
  onMacroExecute?: (macro: Macro) => void;
  onCloseSidebar?: () => void;
  onProjectLoad?: (project: MacroProject) => void;
  onProjectSave?: (project: MacroProject) => void;
  onShowDescription?: (macro: Macro) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  project,
  selectedMacro,
  onMacroSelect,
  onMacroDelete,
  onNewMacro,
  onNewProject,
  onMacroExecute,
  onCloseSidebar,
  onProjectLoad,
  onProjectSave,
  onShowDescription,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultSavePath, setDefaultSavePath] = useState<string>('');

  const filteredMacros = project?.macros.filter(macro =>
    macro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (macro.description && macro.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Récupérer le chemin de sauvegarde par défaut au chargement
  useEffect(() => {
    const getDefaultSavePath = async () => {
      try {
        const result = await ipcRenderer.invoke('get-default-save-path');
        if (result.success) {
          setDefaultSavePath(result.path);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du chemin par défaut:', error);
      }
    };
    
    getDefaultSavePath();
  }, []);

  // Gestion de la fenêtre modale
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowFileModal(false);
      }
    };

    if (showFileModal) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body quand la modal est ouverte
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showFileModal]);

  const handleDeleteMacro = (macro: Macro, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la macro "${macro.name}" ?`)) {
      onMacroDelete(macro.id);
    }
  };

  // Fonctions pour les actions de fichier
  const handleSaveProject = async () => {
    if (!project || !onProjectSave) return;

    try {
      setIsLoading(true);
      setError(null);
      
      if (project.filePath) {
        // Sauvegarder dans le fichier existant
        await ipcRenderer.invoke('save-macro', {
          filePath: project.filePath,
          content: project
        });
        onProjectSave(project);
      } else {
        // Demander un nouveau nom de fichier avec le chemin par défaut
        const defaultFileName = `${project.name || 'projet_macros'}.json`;
        const defaultFullPath = defaultSavePath ? 
          `${defaultSavePath}/${defaultFileName}` : 
          defaultFileName;
          
        const result = await ipcRenderer.invoke('show-save-dialog', {
          title: 'Sauvegarder le projet de macros',
          defaultPath: defaultFullPath,
          filters: [
            { name: 'Fichiers de macros', extensions: ['json'] },
            { name: 'Tous les fichiers', extensions: ['*'] }
          ]
        });

        if (!result.canceled && result.filePath) {
          const updatedProject = {
            ...project,
            filePath: result.filePath,
            fileName: result.filePath.split(/[\\/]/).pop() || 'projet_macros.json',
            modifiedAt: new Date()
          };

          await ipcRenderer.invoke('save-macro', {
            filePath: result.filePath,
            content: updatedProject
          });
          
          onProjectLoad && onProjectLoad(updatedProject);
        }
      }
      setShowFileModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsProject = async () => {
    if (!project || !onProjectLoad) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser le chemin par défaut pour "Sauvegarder sous"
      const defaultFileName = `${project.name || 'projet_macros'}.json`;
      const defaultFullPath = defaultSavePath ? 
        `${defaultSavePath}/${defaultFileName}` : 
        defaultFileName;
        
      const result = await ipcRenderer.invoke('show-save-dialog', {
        title: 'Sauvegarder sous...',
        defaultPath: defaultFullPath,
        filters: [
          { name: 'Fichiers de macros', extensions: ['json'] },
          { name: 'Tous les fichiers', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        const updatedProject = {
          ...project,
          filePath: result.filePath,
          fileName: result.filePath.split(/[\\/]/).pop() || 'projet_macros.json',
          modifiedAt: new Date()
        };

        await ipcRenderer.invoke('save-macro', {
          filePath: result.filePath,
          content: updatedProject
        });
        
        onProjectLoad(updatedProject);
        setShowFileModal(false);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde sous:', error);
      setError('Erreur lors de la sauvegarde sous');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLocation = async () => {
    if (!project?.filePath) return;

    try {
      await ipcRenderer.invoke('show-item-in-folder', project.filePath);
      setShowFileModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de l\'emplacement:', error);
      setError('Erreur lors de l\'ouverture de l\'emplacement');
    }
  };

  const handleDeleteProject = () => {
    if (!project) return;

    const confirmMessage = project.filePath 
      ? `Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?\n\nCette action supprimera définitivement le fichier :\n${project.filePath}`
      : `Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`;

    if (window.confirm(confirmMessage)) {
      if (project.filePath) {
        // Supprimer le fichier du disque
        ipcRenderer.invoke('delete-file', project.filePath).catch((error: any) => {
          console.error('Erreur lors de la suppression du fichier:', error);
        });
      }
      onNewProject(); // Créer un nouveau projet vide
      setShowFileModal(false);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-project-header">
        <div className="project-actions">
          <button
            className="btn btn-sm btn-primary new-project-btn"
            onClick={onNewProject}
            title="Créer un nouveau projet"
          >
            <span className="icon">📁</span>
            {!isCollapsed && 'Nouveau Projet'}
          </button>
          <button
            className="btn btn-sm btn-secondary file-manager-btn"
            onClick={() => setShowFileModal(true)}
            title="Gérer les fichiers"
          >
            <span className="icon">💾</span>
            {!isCollapsed && 'Fichiers'}
          </button>
        </div>
        {onCloseSidebar && (
          <button
            className="sidebar-close-btn"
            onClick={onCloseSidebar}
            title="Fermer la liste des macros"
          >
            <span className="icon">✕</span>
          </button>
        )}
      </div>
      
      <div className="sidebar-header">
        <div className="sidebar-title">
          <button
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Développer la liste des macros' : 'Réduire la liste des macros'}
          >
            <span className={`icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
          </button>
          <h2>Macros ({project?.macros.length || 0})</h2>
        </div>
        <button
          className="btn btn-sm btn-primary"
          onClick={onNewMacro}
          title="Créer une nouvelle macro"
        >
          <span className="icon">+</span>
          {!isCollapsed && 'Nouveau'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="sidebar-content">
          <div className="sidebar-search">
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher une macro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>


          <div className="macro-list">
        {filteredMacros.length === 0 ? (
          <div className="no-macros">
            {project?.macros.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <p>Aucune macro</p>
                <small>Créez votre première macro pour commencer</small>
              </div>
            ) : (
              <div className="no-results">
                <span className="no-results-icon">🔍</span>
                <p>Aucun résultat</p>
                <small>Essayez un autre terme de recherche</small>
              </div>
            )}
          </div>
        ) : (
          filteredMacros.map((macro) => (
            <div
              key={macro.id}
              className={`macro-item ${selectedMacro?.id === macro.id ? 'selected' : ''}`}
              onClick={() => onMacroSelect(macro)}
            >
              <div className="macro-item-content">
                <div className="macro-header">
                  {macro.description && (
                    <div 
                      className="macro-info-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowDescription && onShowDescription(macro);
                      }}
                      title="Voir la description"
                    >
                      ℹ️
                    </div>
                  )}
                  <div className="macro-title-section">
                    <div className="macro-type-indicator">
                      <span className={`type-icon ${macro.type === 'main' ? 'main-type' : 'branche-type'}`}>
                        {macro.type === 'main' ? '🎯' : '🌿'}
                      </span>
                    </div>
                    <h3 className="macro-name">{macro.name}</h3>
                  </div>
                  <div className="macro-actions">
                    <button
                      className="btn-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMacroExecute && onMacroExecute(macro);
                      }}
                      title="Jouer cette macro"
                      disabled={macro.actions.length === 0}
                    >
                      <span className="icon">▶️</span>
                    </button>
                    <button
                      className="btn-delete"
                      onClick={(e) => handleDeleteMacro(macro, e)}
                      title="Supprimer cette macro"
                    >
                      <span className="icon">🗑</span>
                    </button>
                  </div>
                </div>
                

                
                <div className="macro-meta">
                  <span className="action-count">
                    {macro.actions.length} action{macro.actions.length !== 1 ? 's' : ''}
                  </span>
                  <span className="macro-date">
                    Modifié: {new Date(macro.modifiedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
          </div>
          
          {project && (
            <div className="sidebar-footer">
              <div className="project-stats">
                <small>
                  Total: {project.macros.length} macro{project.macros.length !== 1 ? 's' : ''}
                </small>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fenêtre modale de gestion des fichiers */}
      {showFileModal && (
        <div className="file-modal-overlay" onClick={() => setShowFileModal(false)}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <h3>Gestion des fichiers</h3>
              <button 
                className="file-modal-close-btn" 
                onClick={() => setShowFileModal(false)}
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="file-modal-content">
              {error && (
                <div className="file-modal-error">
                  ❌ {error}
                </div>
              )}

              <div className="file-info">
                {project ? (
                  <div className="current-file-info">
                    <h4>Fichier actuel :</h4>
                    <p><strong>Nom :</strong> {project.fileName || 'Non sauvegardé'}</p>
                    <p><strong>Projet :</strong> {project.name}</p>
                    <p><strong>Macros :</strong> {project.macros.length}</p>
                    <p><strong>Dernière modification :</strong> {project.modifiedAt.toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="no-file-info">
                    <p>Aucun fichier ouvert</p>
                  </div>
                )}
              </div>

              <div className="file-actions">
                <button 
                  className="file-action-btn save-file"
                  onClick={handleSaveProject}
                  disabled={isLoading || !project}
                  title="Sauvegarder le projet actuel"
                >
                  <span className="icon">💾</span>
                  Enregistrer le projet
                </button>

                <button 
                  className="file-action-btn save-as-file"
                  onClick={handleSaveAsProject}
                  disabled={isLoading || !project}
                  title="Sauvegarder sous un nouveau nom"
                >
                  <span className="icon">📁</span>
                  Enregistrer sous
                </button>

                <button 
                  className="file-action-btn open-location"
                  onClick={handleOpenLocation}
                  disabled={!project?.filePath}
                  title="Ouvrir l'emplacement du fichier"
                >
                  <span className="icon">📂</span>
                  Ouvrir emplacement
                </button>

                <button 
                  className="file-action-btn delete-file danger"
                  onClick={handleDeleteProject}
                  disabled={isLoading || !project}
                  title="Supprimer le projet actuel"
                >
                  <span className="icon">🗑️</span>
                  Supprimer
                </button>
              </div>

              {isLoading && (
                <div className="file-modal-loading">
                  <div className="spinner"></div>
                  <p>Chargement...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </aside>
  );
};

// Composant Sidebar avec modal intégrée
const SidebarWithModal: React.FC<SidebarProps> = (props) => {
  const [showDescriptionModal, setShowDescriptionModal] = useState<Macro | null>(null);

  const handleShowDescription = (macro: Macro) => {
    console.log('🔍 Affichage de la description pour:', macro.name);
    setShowDescriptionModal(macro);
  };

  const handleCloseDescription = () => {
    setShowDescriptionModal(null);
  };

  return (
    <>
      <Sidebar {...props} onShowDescription={handleShowDescription} />
      <DescriptionModal 
        macro={showDescriptionModal} 
        onClose={handleCloseDescription} 
      />
    </>
  );
};



// Composant modal simplifié
const DescriptionModal: React.FC<{
  macro: Macro | null;
  onClose: () => void;
}> = ({ macro, onClose }) => {
  if (!macro) return null;
  
  console.log('🎯 Rendu de la modal pour:', macro.name, 'Description:', macro.description);

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#2d3748',
          border: '1px solid #4a5568',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '100%',
          color: 'white',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Description de la macro</h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>
              {macro.type === 'main' ? '🎯' : '🌿'}
            </span>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{macro.name}</h4>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#a0aec0' }}>
            <span>{macro.actions.length} action{macro.actions.length !== 1 ? 's' : ''}</span>
            <span>Modifié: {new Date(macro.modifiedAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Description :</h5>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0' }}>
            {macro.description || 'Aucune description disponible'}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SidebarWithModal;
