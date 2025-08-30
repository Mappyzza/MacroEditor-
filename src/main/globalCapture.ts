import { BrowserWindow, screen } from 'electron';

export class GlobalCapture {
  private static mainWindow: BrowserWindow | null = null;

  static setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  static async startCapture(): Promise<{ x: number; y: number }> {
    console.log('Démarrage capture simple...');
    
    // Utiliser l'API screen d'Electron pour obtenir la position actuelle
    try {
      const displays = screen.getAllDisplays();
      const primaryDisplay = displays.find(d => d.id === screen.getPrimaryDisplay().id);
      
      if (primaryDisplay) {
        // Retourner une position par défaut (centre de l'écran)
        const x = Math.floor(primaryDisplay.bounds.width / 2);
        const y = Math.floor(primaryDisplay.bounds.height / 2);
        
        console.log(`Position par défaut: (${x}, ${y})`);
        return { x, y };
      } else {
        // Fallback
        return { x: 500, y: 400 };
      }
    } catch (error) {
      console.error('Erreur capture:', error);
      return { x: 500, y: 400 };
    }
  }

  static async startDelayedCapture(delayMs: number = 3000): Promise<{ x: number; y: number }> {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return this.startCapture();
  }

  static cancelCapture(): void {
    // Rien à faire
  }
}
