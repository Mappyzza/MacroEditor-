import { BrowserWindow, screen } from 'electron';

export interface ActionPayload {
  type: 'click' | 'keypress' | 'type' | 'wait' | 'move' | 'scroll';
  coordinates?: { x: number; y: number };
  value?: string;
  delay?: number;
  button?: 'left' | 'right';
  clickCount?: number;
}

export class SystemActions {
  
  static async executeAction(payload: ActionPayload): Promise<void> {
    console.log('Exécution action:', payload);
    
    switch (payload.type) {
      case 'click':
        await this.executeClick(payload);
        break;
      case 'keypress':
        await this.executeKeypress(payload);
        break;
      case 'type':
        await this.executeType(payload);
        break;
      case 'wait':
        await this.executeWait(payload);
        break;
      case 'move':
        await this.executeMove(payload);
        break;
      case 'scroll':
        await this.executeScroll(payload);
        break;
      default:
        throw new Error(`Type d'action non supporté: ${payload.type}`);
    }
  }

  static async executeClick(payload: ActionPayload): Promise<void> {
    const { coordinates, button = 'left', clickCount = 1 } = payload;
    
    if (!coordinates) {
      throw new Error('Coordonnées requises pour l\'action de clic');
    }

    const { x, y } = coordinates;
    
    // Utiliser les APIs Electron pour simuler le clic
    try {
      // Déplacer le curseur
      await this.executeMove({ type: 'move', coordinates: { x, y } });
      
      // DÉLAI SUPPRIMÉ pour vitesse maximale
      
      // Simuler le clic avec l'API webContents
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        // Envoyer un message au renderer pour simuler le clic
        mainWindow.webContents.send('simulate-click', { x, y, button, clickCount });
      }
      
      console.log(`Clic ${button} exécuté ${clickCount} fois en (${x}, ${y})`);
    } catch (error) {
      console.error('Erreur clic:', error);
      throw new Error(`Erreur clic: ${error}`);
    }
  }

  static async executeKeypress(payload: ActionPayload): Promise<void> {
    const { value } = payload;
    
    if (!value) {
      throw new Error('Valeur de touche requise');
    }

    try {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('simulate-keypress', { key: value });
      }
      console.log(`Touche ${value} pressée`);
    } catch (error) {
      throw new Error(`Erreur touche: ${error}`);
    }
  }

  static async executeType(payload: ActionPayload): Promise<void> {
    const { value } = payload;
    
    if (!value) {
      throw new Error('Texte requis');
    }

    try {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('simulate-type', { text: value });
      }
      console.log(`Texte "${value}" saisi`);
    } catch (error) {
      throw new Error(`Erreur saisie: ${error}`);
    }
  }

  static async executeWait(payload: ActionPayload): Promise<void> {
    const { delay = 1000 } = payload;
    await new Promise(resolve => setTimeout(resolve, delay));
    console.log(`Attente de ${delay}ms terminée`);
  }

  static async executeMove(payload: ActionPayload): Promise<void> {
    const { coordinates } = payload;
    
    if (!coordinates) {
      throw new Error('Coordonnées requises');
    }

    const { x, y } = coordinates;
    
    try {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('simulate-move', { x, y });
      }
      console.log(`Curseur déplacé en (${x}, ${y})`);
    } catch (error) {
      throw new Error(`Erreur déplacement: ${error}`);
    }
  }

  static async executeScroll(payload: ActionPayload): Promise<void> {
    const { value } = payload;
    
    if (!value) {
      throw new Error('Direction requise');
    }

    try {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('simulate-scroll', { direction: value });
      }
      console.log(`Défilement ${value} exécuté`);
    } catch (error) {
      throw new Error(`Erreur défilement: ${error}`);
    }
  }
}
