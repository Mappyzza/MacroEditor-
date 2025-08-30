import React, { useState } from 'react';
import { MacroProject, Macro } from '../../types/macro';
import './Sidebar.css';

interface SidebarProps {
  project: MacroProject | null;
  selectedMacro: Macro | null;
  onMacroSelect: (macro: Macro) => void;
  onMacroDelete: (macroId: string) => void;
  onNewMacro: () => void;
  onNewProject: () => void;
  onMacroExecute?: (macro: Macro) => void;
  onCloseSidebar?: () => void;
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDescriptionFor, setShowDescriptionFor] = useState<string | null>(null);

  const filteredMacros = project?.macros.filter(macro =>
    macro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (macro.description && macro.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleDeleteMacro = (macro: Macro, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la macro "${macro.name}" ?`)) {
      onMacroDelete(macro.id);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-project-header">
        <button
          className="btn btn-sm btn-primary new-project-btn"
          onClick={onNewProject}
          title="Créer un nouveau projet"
        >
          <span className="icon">📁</span>
          {!isCollapsed && 'Nouveau Projet'}
        </button>
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
                  <h3 className="macro-name">{macro.name}</h3>
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
                    {macro.description && (
                      <button
                        className={`btn-info ${showDescriptionFor === macro.id ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDescriptionFor(showDescriptionFor === macro.id ? null : macro.id);
                        }}
                        title={showDescriptionFor === macro.id ? 'Masquer la description' : 'Afficher la description'}
                      >
                        <span className="icon">ℹ️</span>
                      </button>
                    )}
                    <button
                      className="btn-delete"
                      onClick={(e) => handleDeleteMacro(macro, e)}
                      title="Supprimer cette macro"
                    >
                      <span className="icon">🗑</span>
                    </button>
                  </div>
                </div>
                
                {macro.description && showDescriptionFor === macro.id && (
                  <p className="macro-description">{macro.description}</p>
                )}
                
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
    </aside>
  );
};

export default Sidebar;
