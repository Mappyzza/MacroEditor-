import React, { useState, useEffect } from 'react';
import { MacroProject, Macro, MacroAction } from '../types/macro';
import Sidebar from './components/Sidebar';
import MacroEditor from './components/MacroEditor';
import ActionLibrary from './components/ActionLibrary';
import MacroExecutor from './components/MacroExecutor';
import NewMacroModal from './components/NewMacroModal';
import KeyboardMenu from './components/KeyboardMenu';
import './styles/App.css';

const { ipcRenderer } = window.require('electron');

const App: React.FC = () => {
  const [currentProject, setCurrentProject] = useState<MacroProject | null>(null);
  const [selectedMacro, setSelectedMacro] = useState<Macro | null>(null);
  const [workingMacro, setWorkingMacro] = useState<Macro | null>(null); // Macro en cours d'édition (non sauvegardée)
  const [isRecording, setIsRecording] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showActionLibrary, setShowActionLibrary] = useState(false);
  const [showNewMacroModal, setShowNewMacroModal] = useState(false);
  const [showKeyboardMenu, setShowKeyboardMenu] = useState(false);
  const [executingMacro, setExecutingMacro] = useState<Macro | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    // Charger le projet depuis localStorage ou créer un projet par défaut
    const loadProject = () => {
      try {
        const savedProject = localStorage.getItem('macroEditorProject');
        if (savedProject) {
          const parsed = JSON.parse(savedProject);
          // Convertir les dates de string vers Date
          parsed.createdAt = new Date(parsed.createdAt);
          parsed.modifiedAt = new Date(parsed.modifiedAt);
          parsed.macros = parsed.macros.map((macro: any) => ({
            ...macro,
            createdAt: new Date(macro.createdAt),
            modifiedAt: new Date(macro.modifiedAt),
          }));
          console.log('📂 Projet chargé depuis le stockage local:', parsed);
          setCurrentProject(parsed);
          return;
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du projet:', error);
      }

      // Créer un projet par défaut si aucun n'existe
      const defaultProject: MacroProject = {
        id: 'default',
        name: 'Nouveau Projet',
        description: 'Projet de macro par défaut',
        macros: [],
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      console.log('🆕 Nouveau projet créé');
      setCurrentProject(defaultProject);
    };

    loadProject();

    // Écouter les événements du menu
    ipcRenderer.on('menu-new-macro', handleNewMacro);
    ipcRenderer.on('menu-open-macro', handleOpenMacro);
    ipcRenderer.on('menu-save-macro', handleSaveMacro);
    ipcRenderer.on('menu-save-as-macro', handleSaveAsMacro);
    ipcRenderer.on('menu-run-macro', handleRunMacro);
    ipcRenderer.on('menu-stop-macro', handleStopMacro);
    ipcRenderer.on('menu-record-macro', handleRecordMacro);

    // Ajouter les listeners pour les simulations
    const handleSimulateClick = (event: any, data: any) => {
      console.log('Simulation de clic:', data);
      // Ici on pourrait ajouter une logique pour simuler le clic
      alert(`Clic simulé en (${data.x}, ${data.y})`);
    };

    const handleSimulateKeypress = (event: any, data: any) => {
      console.log('Simulation de touche:', data);
      alert(`Touche simulée: ${data.key}`);
    };

    const handleSimulateType = (event: any, data: any) => {
      console.log('Simulation de saisie:', data);
      alert(`Texte saisi: ${data.text}`);
    };

    const handleSimulateMove = (event: any, data: any) => {
      console.log('Simulation de déplacement:', data);
      alert(`Curseur déplacé en (${data.x}, ${data.y})`);
    };

    const handleSimulateScroll = (event: any, data: any) => {
      console.log('Simulation de défilement:', data);
      alert(`Défilement ${data.direction}`);
    };

    // Ajouter les listeners
    ipcRenderer.on('simulate-click', handleSimulateClick);
    ipcRenderer.on('simulate-keypress', handleSimulateKeypress);
    ipcRenderer.on('simulate-type', handleSimulateType);
    ipcRenderer.on('simulate-move', handleSimulateMove);
    ipcRenderer.on('simulate-scroll', handleSimulateScroll);

    return () => {
      ipcRenderer.removeAllListeners('menu-new-macro');
      ipcRenderer.removeAllListeners('menu-open-macro');
      ipcRenderer.removeAllListeners('menu-save-macro');
      ipcRenderer.removeAllListeners('menu-save-as-macro');
      ipcRenderer.removeAllListeners('menu-run-macro');
      ipcRenderer.removeAllListeners('menu-stop-macro');
      ipcRenderer.removeAllListeners('menu-record-macro');
      ipcRenderer.removeListener('simulate-click', handleSimulateClick);
      ipcRenderer.removeListener('simulate-keypress', handleSimulateKeypress);
      ipcRenderer.removeListener('simulate-type', handleSimulateType);
      ipcRenderer.removeListener('simulate-move', handleSimulateMove);
      ipcRenderer.removeListener('simulate-scroll', handleSimulateScroll);
    };
  }, []);

  // Sauvegarder automatiquement le projet à chaque modification
  useEffect(() => {
    if (currentProject) {
      try {
        localStorage.setItem('macroEditorProject', JSON.stringify(currentProject));
        console.log('💾 Projet sauvegardé automatiquement');
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde automatique:', error);
      }
    }
  }, [currentProject]);

  const handleNewProject = () => {
    if (currentProject && currentProject.macros.length > 0) {
      const confirmNew = window.confirm(
        'Créer un nouveau projet effacera le projet actuel. Voulez-vous continuer ?\n\n' +
        'Astuce: Sauvegardez d\'abord votre projet avec Ctrl+S.'
      );
      if (!confirmNew) return;
    }

    const newProject: MacroProject = {
      id: `project-${Date.now()}`,
      name: 'Nouveau Projet',
      description: 'Projet de macro vide',
      macros: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    setCurrentProject(newProject);
    setSelectedMacro(null);
  };

  const handleNewMacro = () => {
    if (!currentProject) return;
    // Fermer tous les autres modals/menus
    setShowKeyboardMenu(false);
    setShowActionLibrary(false);
    setShowNewMacroModal(true);
  };

  const handleCreateMacro = (title: string, description?: string) => {
    if (!currentProject) return;

    const newMacro: Macro = {
      id: `macro-${Date.now()}`,
      name: title,
      description: description || '',
      actions: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
      version: '1.0.0',
    };

    // Créer une nouvelle macro en mode édition (NON sauvegardée dans la liste)
    setSelectedMacro(null); // Pas de macro sauvegardée sélectionnée
    setWorkingMacro(newMacro); // Nouvelle macro en cours d'édition
    setShowNewMacroModal(false);
    
    console.log('🆕 Nouvelle macro créée en mode édition:', title);
  };

  const handleCancelNewMacro = () => {
    setShowNewMacroModal(false);
  };

  const handleOpenMacro = async (event: any, filePath: string) => {
    try {
      const macroData = await ipcRenderer.invoke('load-macro', filePath);
      if (macroData) {
        setCurrentProject({
          ...macroData,
          filePath,
        });
        if (macroData.macros && macroData.macros.length > 0) {
          setSelectedMacro(macroData.macros[0]);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture:', error);
    }
  };

  const handleSaveMacro = async () => {
    if (!currentProject || !currentProject.filePath) return;

    try {
      await ipcRenderer.invoke('save-macro', {
        filePath: currentProject.filePath,
        content: currentProject,
      });
      console.log('Projet sauvegardé avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleMacroTest = async (macro: Macro) => {
    console.log('🧪 Test de la macro en cours:', macro.name);
    
    if (!macro.actions || macro.actions.length === 0) {
      alert('Aucune action à tester dans cette macro.');
      return;
    }
    
    setIsExecuting(true);
    setExecutingMacro(macro);
    
    try {
      console.log('📤 Envoi de la macro en cours de test au processus principal:', macro);
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('execute-macro', macro);
      console.log('📥 Résultat du test:', result);
      
      if (result) {
        console.log('✅ Test de macro terminé avec succès');
      } else {
        console.error('❌ Le test de la macro a échoué');
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de la macro:', error);
      alert(`Erreur lors du test: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExecuting(false);
      setExecutingMacro(null);
    }
  };

  const handleMacroSave = (macro: Macro) => {
    console.log('💾 Sauvegarde de la macro:', macro.name);
    
    if (!macro.name.trim()) {
      alert('Veuillez donner un nom à la macro avant de la sauvegarder.');
      return;
    }
    
    if (!macro.actions || macro.actions.length === 0) {
      alert('Impossible de sauvegarder une macro vide.');
      return;
    }
    
    try {
      // Sauvegarder la macro dans le projet
      if (currentProject) {
        const existingIndex = currentProject.macros.findIndex(m => m.id === macro.id);
        
        const updatedProject = {
          ...currentProject,
          macros: existingIndex >= 0 
            ? currentProject.macros.map((m, index) => 
                index === existingIndex ? { ...macro, modifiedAt: new Date() } : m
              )
            : [...currentProject.macros, { ...macro, modifiedAt: new Date() }],
          modifiedAt: new Date(),
        };
        
        setCurrentProject(updatedProject);
        
        // Mettre à jour la macro sélectionnée avec la version sauvegardée
        const savedMacro = existingIndex >= 0 
          ? updatedProject.macros[existingIndex]
          : updatedProject.macros[updatedProject.macros.length - 1];
        
        setSelectedMacro(savedMacro);
        setWorkingMacro(savedMacro); // Synchroniser la copie de travail
        
        // Afficher une notification de succès
        alert(`✅ Macro "${macro.name}" sauvegardée avec succès !`);
        console.log('✅ Macro sauvegardée dans le projet');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert(`❌ Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleMacroExecuteFromSidebar = async (macro: Macro) => {
    console.log('▶️ Exécution de la macro sauvegardée depuis la sidebar:', macro.name);
    
    // Vérifier que la macro est bien dans la liste des macros sauvegardées
    if (!currentProject?.macros.find(m => m.id === macro.id)) {
      alert('❌ Cette macro n\'est pas sauvegardée. Seules les macros sauvegardées peuvent être exécutées depuis la liste.');
      return;
    }
    
    if (!macro.actions || macro.actions.length === 0) {
      alert('❌ Cette macro ne contient aucune action à exécuter.');
      return;
    }
    
    setIsExecuting(true);
    setExecutingMacro(macro);
    
    try {
      console.log('📤 Envoi de la macro sauvegardée au processus principal:', macro);
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('execute-macro', macro);
      console.log('📥 Résultat d\'exécution:', result);
      
      if (result) {
        console.log('✅ Macro sauvegardée exécutée avec succès');
      } else {
        console.error('❌ L\'exécution de la macro sauvegardée a échoué');
        alert('❌ L\'exécution de la macro a échoué.');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution de la macro sauvegardée:', error);
      alert(`❌ Erreur lors de l'exécution: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExecuting(false);
      setExecutingMacro(null);
    }
  };

  const handleSaveAsMacro = async (event: any, filePath: string) => {
    if (!currentProject) return;

    try {
      const updatedProject = {
        ...currentProject,
        filePath,
        modifiedAt: new Date(),
      };

      await ipcRenderer.invoke('save-macro', {
        filePath,
        content: updatedProject,
      });

      setCurrentProject(updatedProject);
      console.log('Projet sauvegardé sous:', filePath);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleRunMacro = async () => {
    if (!selectedMacro) return;

    setIsExecuting(true);
    try {
      await ipcRenderer.invoke('execute-macro', selectedMacro);
      console.log('Macro exécutée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'exécution:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStopMacro = () => {
    setIsExecuting(false);
    setIsRecording(false);
  };

  const handleRecordMacro = () => {
    setIsRecording(!isRecording);
  };

  const handleMacroSelect = (macro: Macro) => {
    // Créer une copie de travail de la macro sauvegardée
    const workingCopy = {
      ...macro,
      id: macro.id, // Garder le même ID pour identifier la macro sauvegardée
      modifiedAt: new Date()
    };
    setSelectedMacro(macro); // Référence à la macro sauvegardée
    setWorkingMacro(workingCopy); // Copie de travail
    console.log('📝 Macro sélectionnée pour édition:', macro.name);
  };

  const handleMacroUpdate = (updatedMacro: Macro) => {
    // Mettre à jour seulement la macro de travail, PAS celle sauvegardée
    setWorkingMacro(updatedMacro);
    console.log('✏️ Macro de travail mise à jour (non sauvegardée)');
  };

  const handleActionAdd = (action: MacroAction) => {
    if (!workingMacro) return;

    const updatedMacro = {
      ...workingMacro,
      actions: [...workingMacro.actions, action],
      modifiedAt: new Date(),
    };

    handleMacroUpdate(updatedMacro);
  };

  const handleOpenKeyboardMenu = () => {
    setShowKeyboardMenu(true);
    setShowActionLibrary(false); // Fermer la bibliothèque d'actions
  };

  const handleCloseKeyboardMenu = () => {
    setShowKeyboardMenu(false);
  };

  const handleMacroDelete = (macroId: string) => {
    if (!currentProject) return;

    const updatedMacros = currentProject.macros.filter(macro => macro.id !== macroId);
    const updatedProject = {
      ...currentProject,
      macros: updatedMacros,
      modifiedAt: new Date(),
    };

    setCurrentProject(updatedProject);
    
    // Si la macro supprimée était sélectionnée ou en cours d'édition, nettoyer l'état
    if (selectedMacro?.id === macroId) {
      setSelectedMacro(updatedMacros.length > 0 ? updatedMacros[0] : null);
      setWorkingMacro(updatedMacros.length > 0 ? { ...updatedMacros[0] } : null);
    } else if (workingMacro?.id === macroId) {
      // Si la macro supprimée était en cours d'édition mais pas sélectionnée
      setWorkingMacro(null);
    }
    
    console.log(`🗑️ Macro "${macroId}" supprimée et interface nettoyée`);
  };

  return (
    <div className="app">
      {/* Bouton hamburger pour ouvrir la sidebar */}
      {!sidebarVisible && (
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarVisible(true)}
          title="Ouvrir la liste des macros"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <div className="app-content">
        {sidebarVisible && (
          <>
            <div 
              className="sidebar-overlay" 
              onClick={() => setSidebarVisible(false)}
            />
            <Sidebar
              project={currentProject}
              selectedMacro={selectedMacro}
              onMacroSelect={handleMacroSelect}
              onMacroDelete={handleMacroDelete}
              onNewMacro={handleNewMacro}
              onNewProject={handleNewProject}
              onMacroExecute={handleMacroExecuteFromSidebar}
              onCloseSidebar={() => setSidebarVisible(false)}
            />
          </>
        )}
        
        <div className="main-content">
          {workingMacro ? (
            <MacroEditor
              macro={workingMacro}
              onMacroUpdate={handleMacroUpdate}
              isRecording={isRecording}
              isExecuting={isExecuting}
              onMacroTest={handleMacroTest}
              onMacroSave={handleMacroSave}
              onOpenActionLibrary={() => setShowActionLibrary(true)}
            />
          ) : null}
        </div>
      </div>
      
      

      {/* ActionLibrary avec gestion d'overlay intégrée */}
      <ActionLibrary
        onActionAdd={handleActionAdd}
        onClose={() => setShowActionLibrary(false)}
        onOpenKeyboardMenu={handleOpenKeyboardMenu}
        isVisible={showActionLibrary}
      />

      <NewMacroModal
        isVisible={showNewMacroModal}
        onConfirm={handleCreateMacro}
        onCancel={handleCancelNewMacro}
      />
      
      {isExecuting && executingMacro && (
        <MacroExecutor
          macro={executingMacro}
          onComplete={() => setIsExecuting(false)}
          onStop={() => setIsExecuting(false)}
        />
      )}

      {/* Menu clavier en plein écran */}
      {showKeyboardMenu && (
        <KeyboardMenu 
          onActionAdd={handleActionAdd} 
          onClose={handleCloseKeyboardMenu} 
        />
      )}
    </div>
  );
};

export default App;
