import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { SimpleActions, ActionPayload } from './simpleActions';
import { SystemActions } from './systemActions';
import { globalMouseHook, MouseEvent } from './globalMouseHook';

class MacroEditorApp {
  private mainWindow: BrowserWindow | null = null;
  private keyboardShortcutsEnabled: boolean = true;
  private virtualKeyboardActive: boolean = false;
  private defaultSavePath: string = '';

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    app.whenReady().then(() => {
      this.initializeDefaultSavePath();
      this.createWindow();
      this.setupMenu();
      this.setupIPC();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      icon: path.join(__dirname, '../../assets/icon.png'),
      show: false,
      titleBarStyle: 'default',
    });

    // Charger l'interface utilisateur
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Intercepteur d'événements clavier pour bloquer les raccourcis intégrés
    this.setupKeyboardInterceptor();
  }

  private initializeDefaultSavePath(): void {
    try {
      // Créer le dossier de sauvegarde dans le répertoire de l'application
      const appPath = app.getAppPath();
      this.defaultSavePath = path.join(appPath, 'sauvegardes projets');
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(this.defaultSavePath)) {
        fs.mkdirSync(this.defaultSavePath, { recursive: true });
        console.log(`📁 Dossier de sauvegarde créé: ${this.defaultSavePath}`);
      } else {
        console.log(`📁 Dossier de sauvegarde existant: ${this.defaultSavePath}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création du dossier de sauvegarde:', error);
      // Fallback vers le dossier Documents
      this.defaultSavePath = path.join(require('os').homedir(), 'Documents', 'MacroEditor', 'sauvegardes projets');
      try {
        fs.mkdirSync(this.defaultSavePath, { recursive: true });
        console.log(`📁 Dossier de sauvegarde de fallback créé: ${this.defaultSavePath}`);
      } catch (fallbackError) {
        console.error('Erreur lors de la création du dossier de fallback:', fallbackError);
        this.defaultSavePath = '';
      }
    }
  }

  private setupKeyboardInterceptor(): void {
    if (!this.mainWindow) return;

    // Intercepter les événements clavier avant qu'ils ne soient traités par Electron
    this.mainWindow.webContents.on('before-input-event', (event, input) => {
      // Si le clavier virtuel est actif, bloquer les raccourcis qui interfèrent
      if (this.virtualKeyboardActive) {
        // Bloquer F12 (outils de développement)
        const isF12 = input.key === 'F12';
        
        // Bloquer les raccourcis de développement
        const isCtrlShiftI = input.control && input.shift && input.key.toLowerCase() === 'i';
        const isCtrlShiftJ = input.control && input.shift && input.key.toLowerCase() === 'j';
        
        // Ne bloquer que les raccourcis qui interfèrent vraiment
        if (isF12 || isCtrlShiftI || isCtrlShiftJ) {
          console.log(`🚫 Raccourci intégré bloqué: ${input.key} (clavier virtuel actif)`);
          event.preventDefault();
          return;
        }
        
        // Pour Ctrl+C, Ctrl+X, Ctrl+V, on les laisse passer car ils sont utilisés dans le clavier virtuel
        // Le menu est déjà désactivé, donc ils ne déclencheront pas les actions de menu
      }
    });
  }

  private setupMenu(): void {
    this.updateMenu();
  }

  private updateMenu(): void {
    const template = [
      {
        label: 'Fichier',
        submenu: [
          {
            label: 'Nouveau',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.newMacro(),
          },
          {
            label: 'Ouvrir',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.openMacro(),
          },
          {
            label: 'Enregistrer',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.saveMacro(),
          },
          {
            label: 'Enregistrer sous...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.saveAsMacro(),
          },
          { type: 'separator' },
          {
            label: 'Quitter',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit(),
          },
        ],
      },
      {
        label: 'Édition',
        submenu: [
          { label: 'Annuler', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: 'Rétablir', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
          { type: 'separator' },
          { 
            label: 'Couper', 
            accelerator: this.virtualKeyboardActive ? undefined : 'CmdOrCtrl+X', 
            role: this.virtualKeyboardActive ? undefined : 'cut',
            click: this.virtualKeyboardActive ? () => {
              console.log('🚫 Couper bloqué (clavier virtuel actif)');
            } : undefined
          },
          { 
            label: 'Copier', 
            accelerator: this.virtualKeyboardActive ? undefined : 'CmdOrCtrl+C', 
            role: this.virtualKeyboardActive ? undefined : 'copy',
            click: this.virtualKeyboardActive ? () => {
              console.log('🚫 Copier bloqué (clavier virtuel actif)');
            } : undefined
          },
          { 
            label: 'Coller', 
            accelerator: this.virtualKeyboardActive ? undefined : 'CmdOrCtrl+V', 
            role: this.virtualKeyboardActive ? undefined : 'paste',
            click: this.virtualKeyboardActive ? () => {
              console.log('🚫 Coller bloqué (clavier virtuel actif)');
            } : undefined
          },
        ],
      },
      {
        label: 'Macro',
        submenu: [
          {
            label: 'Exécuter',
            accelerator: 'F5',
            click: () => this.runMacro(),
          },
          {
            label: 'Arrêter',
            accelerator: 'Ctrl+F5',
            click: () => this.stopMacro(),
          },
          { type: 'separator' },
          {
            label: 'Enregistrer une macro',
            accelerator: 'F6',
            click: () => this.recordMacro(),
          },
        ],
      },
      {
        label: 'Affichage',
        submenu: [
          { label: 'Recharger', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          { 
            label: 'Basculer les outils de développement', 
            accelerator: this.virtualKeyboardActive ? undefined : 'F12', 
            role: this.virtualKeyboardActive ? undefined : 'toggleDevTools',
            click: this.virtualKeyboardActive ? () => {} : undefined
          },
          { type: 'separator' },
          { label: 'Zoom avant', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
          { label: 'Zoom arrière', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
          { label: 'Zoom par défaut', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }

  private setupIPC(): void {
    ipcMain.handle('save-macro', async (event, macroData) => {
      return await this.handleSaveMacro(macroData);
    });

    ipcMain.handle('load-macro', async (event, filePath) => {
      return await this.handleLoadMacro(filePath);
    });

    ipcMain.handle('execute-macro', async (event, macroData) => {
      return await this.handleExecuteMacro(macroData);
    });

    // Nouveau handler pour exécuter une action système
    ipcMain.handle('execute-system-action', async (event, actionPayload: ActionPayload) => {
      try {
        await SystemActions.executeAction(actionPayload);
        return { success: true };
      } catch (error) {
        console.error('Erreur lors de l\'exécution de l\'action système:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler spécial pour exécuter une intégration de manière synchrone
    ipcMain.handle('execute-integration-sync', async (event, data: { integrationMacroId: string, repeatCount: number }) => {
      try {
        console.log('🔗 Exécution synchrone d\'intégration:', data);
        
        // Demander au renderer d'exécuter la macro intégrée
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) {
          throw new Error('Fenêtre principale introuvable');
        }

        // Envoyer le message au renderer
        mainWindow.webContents.send('execute-integration', data);
        
        // Attendre que l'exécution soit terminée
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout lors de l\'exécution de l\'intégration'));
          }, 30000); // 30 secondes de timeout

          const responseHandler = (event: any, result: { success: boolean, error?: string }) => {
            clearTimeout(timeout);
            ipcMain.removeListener('integration-execution-complete', responseHandler);
            
            if (result.success) {
              resolve({ success: true });
            } else {
              reject(new Error(result.error || 'Erreur lors de l\'exécution de l\'intégration'));
            }
          };

          ipcMain.on('integration-execution-complete', responseHandler);
        });
        
      } catch (error) {
        console.error('Erreur lors de l\'exécution de l\'intégration:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour la capture globale de position
    ipcMain.handle('start-global-capture', async (event) => {
      try {
        // Attendre 2 secondes puis capturer la position RÉELLE de la souris
        await new Promise(resolve => setTimeout(resolve, 2000));
        const position = await SimpleActions.getRealMousePosition();
        return { success: true, position };
      } catch (error) {
        console.error('Erreur lors de la capture globale:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour la capture de position (utilisé par ActionSidebar)
    ipcMain.handle('start-position-capture', async (event) => {
      try {
        console.log('🎯 Démarrage capture position en temps réel...');
        
        // Démarrer la capture globale de souris
        await globalMouseHook.startCapture();
        
        // Attendre le prochain clic avec un timeout de 15 secondes
        const mouseEvent = await globalMouseHook.captureNextClick(15000);
        
        // Arrêter la capture
        await globalMouseHook.stopCapture();
        
        console.log(`✅ Position capturée: (${mouseEvent.x}, ${mouseEvent.y})`);
        return { x: mouseEvent.x, y: mouseEvent.y };
        
      } catch (error) {
        console.error('Erreur lors de la capture de position:', error);
        
        // Arrêter la capture en cas d'erreur
        try {
          await globalMouseHook.stopCapture();
        } catch (stopError) {
          console.error('Erreur lors de l\'arrêt de la capture:', stopError);
        }
        
        // Fallback vers la méthode simple
        try {
          const position = await SimpleActions.getRealMousePosition();
          return position;
        } catch (fallbackError) {
          console.error('Erreur fallback capture:', fallbackError);
          return { x: 0, y: 0 }; // Position par défaut en cas d'erreur
        }
      }
    });

    // Handler pour démarrer la capture globale de clics
    ipcMain.handle('start-global-mouse-capture', async (event) => {
      try {
        console.log('🎯 Démarrage capture globale souris...');
        await globalMouseHook.startCapture();
        return { success: true };
      } catch (error) {
        console.error('Erreur lors du démarrage capture globale souris:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour arrêter la capture globale de clics
    ipcMain.handle('stop-global-mouse-capture', async (event) => {
      try {
        console.log('🛑 Arrêt capture globale souris...');
        await globalMouseHook.stopCapture();
        return { success: true };
      } catch (error) {
        console.error('Erreur lors de l\'arrêt capture globale souris:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour capturer le prochain clic
    ipcMain.handle('capture-next-click', async (event, timeoutMs: number = 10000) => {
      try {
        console.log('👆 Attente du prochain clic...');
        const mouseEvent = await globalMouseHook.captureNextClick(timeoutMs);
        return { success: true, mouseEvent };
      } catch (error) {
        console.error('Erreur lors de la capture du clic:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour vérifier le statut de capture
    ipcMain.handle('is-capturing-mouse', async (event) => {
      return { 
        success: true, 
        isCapturing: globalMouseHook.isCapturingMouse() 
      };
    });

    // Handler pour la capture globale avec délai
    ipcMain.handle('start-delayed-global-capture', async (event, delayMs: number) => {
      try {
        // Attendre le délai puis capturer la position RÉELLE
        await new Promise(resolve => setTimeout(resolve, delayMs));
        const position = await SimpleActions.getRealMousePosition();
        return { success: true, position };
      } catch (error) {
        console.error('Erreur lors de la capture globale avec délai:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour annuler la capture
    ipcMain.handle('cancel-global-capture', async (event) => {
      try {
        await globalMouseHook.stopCapture();
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler simple pour obtenir la position actuelle du curseur RÉELLE
    ipcMain.handle('get-cursor-position', async (event) => {
      try {
        const position = await SimpleActions.getRealMousePosition();
        return { success: true, position };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour désactiver les raccourcis clavier (quand le clavier virtuel est ouvert)
    ipcMain.handle('disable-keyboard-shortcuts', async (event) => {
      this.virtualKeyboardActive = true;
      this.updateMenu();
      console.log('🚫 Raccourcis de menu désactivés (clavier virtuel actif)');
      console.log('🔍 État virtualKeyboardActive:', this.virtualKeyboardActive);
      return { success: true };
    });

    // Handler pour réactiver les raccourcis clavier (quand le clavier virtuel est fermé)
    ipcMain.handle('enable-keyboard-shortcuts', async (event) => {
      this.virtualKeyboardActive = false;
      this.updateMenu();
      console.log('✅ Raccourcis de menu réactivés (clavier virtuel fermé)');
      return { success: true };
    });

    // Handler pour annuler la capture de position
    ipcMain.handle('cancel-position-capture', async (event) => {
      try {
        console.log('🛑 Annulation capture position...');
        await globalMouseHook.stopCapture();
        return { success: true };
      } catch (error) {
        console.error('Erreur lors de l\'annulation de la capture:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour afficher le dialogue de sauvegarde
    ipcMain.handle('show-save-dialog', async (event, options) => {
      try {
        if (!this.mainWindow) return { canceled: true };
        const result = await dialog.showSaveDialog(this.mainWindow, options);
        return result;
      } catch (error) {
        console.error('Erreur lors de l\'affichage du dialogue de sauvegarde:', error);
        return { canceled: true, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour afficher le dialogue d'ouverture
    ipcMain.handle('show-open-dialog', async (event, options) => {
      try {
        if (!this.mainWindow) return { canceled: true };
        const result = await dialog.showOpenDialog(this.mainWindow, options);
        return result;
      } catch (error) {
        console.error('Erreur lors de l\'affichage du dialogue d\'ouverture:', error);
        return { canceled: true, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour ouvrir l'emplacement du fichier dans l'explorateur
    ipcMain.handle('show-item-in-folder', async (event, filePath) => {
      try {

        await shell.showItemInFolder(filePath);
        return { success: true };
      } catch (error) {
        console.error('Erreur lors de l\'ouverture de l\'emplacement:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour supprimer un fichier
    ipcMain.handle('delete-file', async (event, filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Fichier supprimé: ${filePath}`);
          return { success: true };
        } else {
          return { success: false, error: 'Fichier non trouvé' };
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    // Handler pour obtenir le chemin de sauvegarde par défaut
    ipcMain.handle('get-default-save-path', async (event) => {
      return { success: true, path: this.defaultSavePath };
    });
  }

  private newMacro(): void {
    this.mainWindow?.webContents.send('menu-new-macro');
  }

  private async openMacro(): Promise<void> {
    if (!this.mainWindow) return;

    const result = await dialog.showOpenDialog(this.mainWindow, {
      defaultPath: this.defaultSavePath,
      filters: [
        { name: 'Fichiers Macro', extensions: ['json', 'macro'] },
        { name: 'Tous les fichiers', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      this.mainWindow.webContents.send('menu-open-macro', result.filePaths[0]);
    }
  }

  private saveMacro(): void {
    this.mainWindow?.webContents.send('menu-save-macro');
  }

  private async saveAsMacro(): Promise<void> {
    if (!this.mainWindow) return;

    const result = await dialog.showSaveDialog(this.mainWindow, {
      filters: [
        { name: 'Fichiers Macro', extensions: ['json'] },
        { name: 'Tous les fichiers', extensions: ['*'] },
      ],
      defaultPath: 'nouvelle-macro.json',
    });

    if (!result.canceled && result.filePath) {
      this.mainWindow.webContents.send('menu-save-as-macro', result.filePath);
    }
  }

  private runMacro(): void {
    this.mainWindow?.webContents.send('menu-run-macro');
  }

  private stopMacro(): void {
    this.mainWindow?.webContents.send('menu-stop-macro');
  }

  private recordMacro(): void {
    this.mainWindow?.webContents.send('menu-record-macro');
  }

  private async handleSaveMacro(macroData: any): Promise<boolean> {
    try {
      if (macroData.filePath) {
        await fs.promises.writeFile(macroData.filePath, JSON.stringify(macroData.content, null, 2));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  }

  private async handleLoadMacro(filePath: string): Promise<any> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return null;
    }
  }

  private async handleExecuteMacro(macroData: any): Promise<boolean> {
    try {
      console.log('🎯 EXÉCUTION DIRECTE - Macro:', macroData.name);
      
      if (!macroData.actions || !Array.isArray(macroData.actions)) {
        console.error('❌ Aucune action trouvée dans la macro');
        return false;
      }

      console.log(`📋 Exécution de ${macroData.actions.length} actions...`);

      // Exécuter chaque action de la macro
      for (let i = 0; i < macroData.actions.length; i++) {
        const action = macroData.actions[i];
        console.log(`🔄 Action ${i + 1}/${macroData.actions.length}: ${action.type}`);

        try {
          // Convertir l'action MacroAction en ActionPayload
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
          
          console.log(`🔍 Action payload:`, actionPayload);
          await SimpleActions.executeAction(actionPayload);
          console.log(`✅ Action ${i + 1} terminée avec succès`);
        } catch (actionError) {
          console.error(`❌ Erreur action ${i + 1}:`, actionError);
          return false;
        }
      }

      console.log('🎉 Macro exécutée avec succès !');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution de la macro:', error);
      return false;
    }
  }
}

// Créer l'application
new MacroEditorApp();
