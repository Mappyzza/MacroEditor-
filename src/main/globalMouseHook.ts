import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export interface MouseEvent {
  x: number;
  y: number;
  button: 'left' | 'right' | 'middle';
  action: 'down' | 'up' | 'click';
  timestamp: number;
}

export class GlobalMouseHook extends EventEmitter {
  private isCapturing = false;
  private captureProcess: any = null;
  private hookScript: string = '';

  constructor() {
    super();
    this.setupHookScript();
  }

  private setupHookScript(): void {
    // Script PowerShell simplifié utilisant une boucle pour capturer les clics
    this.hookScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Boucle pour surveiller les clics
while ($true) {
    Start-Sleep -Milliseconds 50
    
    # Vérifier si le bouton gauche de la souris est pressé
    if ([System.Windows.Forms.Control]::MouseButtons -eq [System.Windows.Forms.MouseButtons]::Left) {
        # Obtenir la position actuelle de la souris
        $pos = [System.Windows.Forms.Cursor]::Position
        Write-Host "MOUSE_EVENT:$($pos.X),$($pos.Y),left,down,$([DateTimeOffset]::Now.ToUnixTimeMilliseconds())"
        
        # Attendre que le bouton soit relâché pour éviter les doublons
        while ([System.Windows.Forms.Control]::MouseButtons -eq [System.Windows.Forms.MouseButtons]::Left) {
            Start-Sleep -Milliseconds 10
        }
    }
    
    # Vérifier si le bouton droit de la souris est pressé
    if ([System.Windows.Forms.Control]::MouseButtons -eq [System.Windows.Forms.MouseButtons]::Right) {
        $pos = [System.Windows.Forms.Cursor]::Position
        Write-Host "MOUSE_EVENT:$($pos.X),$($pos.Y),right,down,$([DateTimeOffset]::Now.ToUnixTimeMilliseconds())"
        
        # Attendre que le bouton soit relâché
        while ([System.Windows.Forms.Control]::MouseButtons -eq [System.Windows.Forms.MouseButtons]::Right) {
            Start-Sleep -Milliseconds 10
        }
    }
}
`;
  }

  async startCapture(): Promise<void> {
    if (this.isCapturing) {
      console.log('⚠️ Capture déjà en cours');
      return;
    }

    console.log('🎯 Démarrage capture globale de souris...');
    this.isCapturing = true;

    try {
      // Écrire le script dans un fichier temporaire
      const fs = require('fs');
      const path = require('path');
      const tempDir = require('os').tmpdir();
      const scriptPath = path.join(tempDir, 'mouse-hook.ps1');
      
      await fs.promises.writeFile(scriptPath, this.hookScript);

      // Exécuter le script en arrière-plan
      const { spawn } = require('child_process');
      this.captureProcess = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Unrestricted',
        '-File', scriptPath
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.captureProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        const lines = output.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('MOUSE_EVENT:')) {
            this.parseMouseEvent(line);
          }
        }
      });

      this.captureProcess.stderr.on('data', (data: Buffer) => {
        console.error('Erreur hook souris:', data.toString());
      });

      this.captureProcess.on('close', (code: number) => {
        console.log(`🔚 Hook souris fermé avec le code ${code}`);
        this.isCapturing = false;
        this.captureProcess = null;
      });

      this.emit('captureStarted');
      console.log('✅ Capture globale de souris démarrée');

    } catch (error) {
      console.error('❌ Erreur démarrage capture:', error);
      this.isCapturing = false;
      throw error;
    }
  }

  private parseMouseEvent(eventLine: string): void {
    try {
      // Format: MOUSE_EVENT:x,y,button,action,timestamp
      const data = eventLine.replace('MOUSE_EVENT:', '');
      const [x, y, button, action, timestamp] = data.split(',');

      const mouseEvent: MouseEvent = {
        x: parseInt(x),
        y: parseInt(y),
        button: button as 'left' | 'right' | 'middle',
        action: action as 'down' | 'up' | 'click',
        timestamp: parseInt(timestamp)
      };

      // Émettre l'événement pour les listeners
      this.emit('mouseEvent', mouseEvent);

      console.log(`🖱️ Clic capturé: ${mouseEvent.button} ${mouseEvent.action} à (${mouseEvent.x}, ${mouseEvent.y})`);

    } catch (error) {
      console.error('❌ Erreur parsing événement souris:', error);
    }
  }

  async stopCapture(): Promise<void> {
    if (!this.isCapturing) {
      console.log('⚠️ Aucune capture en cours');
      return;
    }

    console.log('🛑 Arrêt capture globale de souris...');

    if (this.captureProcess) {
      this.captureProcess.kill();
      this.captureProcess = null;
    }

    this.isCapturing = false;
    this.emit('captureStopped');
    console.log('✅ Capture globale de souris arrêtée');
  }

  isCapturingMouse(): boolean {
    return this.isCapturing;
  }

  // Méthode simplifiée pour capturer un seul clic
  async captureNextClick(timeoutMs: number = 10000): Promise<MouseEvent> {
    return new Promise((resolve, reject) => {
      if (!this.isCapturing) {
        reject(new Error('Capture non démarrée'));
        return;
      }

      const timeout = setTimeout(() => {
        this.removeListener('mouseEvent', onMouseEvent);
        reject(new Error('Timeout - aucun clic capturé'));
      }, timeoutMs);

      const onMouseEvent = (event: MouseEvent) => {
        if (event.action === 'down') { // Capturer au moment du clic
          clearTimeout(timeout);
          this.removeListener('mouseEvent', onMouseEvent);
          resolve(event);
        }
      };

      this.once('mouseEvent', onMouseEvent);
    });
  }
}

// Instance singleton
export const globalMouseHook = new GlobalMouseHook();
