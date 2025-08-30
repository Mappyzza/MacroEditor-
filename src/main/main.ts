import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { SimpleActions, ActionPayload } from './simpleActions';
import { globalMouseHook, MouseEvent } from './globalMouseHook';

class MacroEditorApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    app.whenReady().then(() => {
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

    // Initialiser GlobalCapture avec la référence de la fenêtre
            // Plus besoin de GlobalCapture
  }

  private setupMenu(): void {
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
          { label: 'Couper', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: 'Copier', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: 'Coller', accelerator: 'CmdOrCtrl+V', role: 'paste' },
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
          { label: 'Basculer les outils de développement', accelerator: 'F12', role: 'toggleDevTools' },
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
        await SimpleActions.executeAction(actionPayload);
        return { success: true };
      } catch (error) {
        console.error('Erreur lors de l\'exécution de l\'action système:', error);
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
        // Attendre 1 seconde puis capturer la position RÉELLE de la souris
        await new Promise(resolve => setTimeout(resolve, 1000));
        const position = await SimpleActions.getRealMousePosition();
        return position; // Retourner directement les coordonnées
      } catch (error) {
        console.error('Erreur lors de la capture de position:', error);
        return { x: 0, y: 0 }; // Position par défaut en cas d'erreur
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
  }

  private newMacro(): void {
    this.mainWindow?.webContents.send('menu-new-macro');
  }

  private async openMacro(): Promise<void> {
    if (!this.mainWindow) return;

    const result = await dialog.showOpenDialog(this.mainWindow, {
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
