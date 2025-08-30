import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

export interface ActionPayload {
  type: 'click' | 'keypress' | 'type' | 'wait' | 'move' | 'scroll';
  coordinates?: { x: number; y: number };
  value?: string;
  delay?: number;
  button?: 'left' | 'right';
  clickCount?: number;
}

export class SimpleActions {
  
  static async executeAction(payload: ActionPayload): Promise<void> {
    console.log('Exécution action simple:', payload);
    
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
      default:
        console.log(`Action ${payload.type} simulée`);
    }
  }

    static async executeClick(payload: ActionPayload): Promise<void> {
    const { coordinates, button = 'left', clickCount = 1 } = payload;
    
    if (!coordinates) {
      throw new Error('Coordonnées requises');
    }

    const { x, y } = coordinates;
    
    console.log(`🎯 EXÉCUTION DIRECTE - Clic ${button} ${clickCount}x en (${x}, ${y})`);

    try {
      // MÉTHODE PRINCIPALE: PowerShell avec APIs Windows natives (plus fiable)
      const leftDown = button === 'left' ? '0x02' : '0x08';
      const leftUp = button === 'left' ? '0x04' : '0x10';
      
      let psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Positionner le curseur AVANT de cliquer
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})

# Attendre que le curseur soit bien positionné
Start-Sleep -Milliseconds 10

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);
}
"@

`;
      
      // Ajouter tous les clics avec délai minimal entre eux
      for (let i = 0; i < clickCount; i++) {
        psScript += `[Win32]::mouse_event(${leftDown}, 0, 0, 0, 0); Start-Sleep -Milliseconds 5; [Win32]::mouse_event(${leftUp}, 0, 0, 0, 0)\n`;
        if (i < clickCount - 1) {
          psScript += `Start-Sleep -Milliseconds 50\n`; // Délai minimal entre clics
        }
      }
      
      const psFile = path.join(os.tmpdir(), `click-${Date.now()}.ps1`);
      
      await fs.promises.writeFile(psFile, psScript);
      await execAsync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`);
      
      try {
        await fs.promises.unlink(psFile);
      } catch (cleanupError) {
        // Ignorer
      }
      
      console.log(`✅ SUCCÈS - Clic ${button} ${clickCount}x exécuté en (${x}, ${y})`);
      return;
      
    } catch (error) {
      console.log('❌ PowerShell échoué, essai nircmd...', error instanceof Error ? error.message : String(error));
      
      // FALLBACK: nircmd (plus simple et fiable)
      try {
        const nircmdPath = path.join(__dirname, '../../tools/nircmd.exe');
        
        // Positionner le curseur AVANT de cliquer
        await execAsync(`"${nircmdPath}" setcursor ${x} ${y}`);
        
        // Attendre que le curseur soit bien positionné
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Exécuter les clics
        const clickType = button === 'left' ? 'left' : 'right';
        for (let i = 0; i < clickCount; i++) {
          await execAsync(`"${nircmdPath}" sendmouse ${clickType} click`);
          if (i < clickCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Délai minimal
          }
        }
        
        console.log(`✅ SUCCÈS nircmd - Clic ${button} ${clickCount}x en (${x}, ${y})`);
        return;
        
      } catch (nircmdError) {
        console.error('❌ Toutes les méthodes ont échoué:', nircmdError);
        throw new Error(`Impossible d'exécuter le clic ${button} ${clickCount}x en (${x}, ${y}): ${nircmdError instanceof Error ? nircmdError.message : String(nircmdError)}`);
      }
    }
  }

  static async executeKeypress(payload: ActionPayload): Promise<void> {
    const { value } = payload;
    
    if (!value) {
      throw new Error('Valeur de touche requise');
    }

    console.log(`⌨️ EXÉCUTION DIRECTE - Touche: ${value}`);

    try {
             // MÉTHODE 1: Utiliser nircmd
       try {
         const nircmdPath = path.join(__dirname, '../../tools/nircmd.exe');
        const nircmdCommand = `"${nircmdPath}" sendkeypress ${value}`;
        console.log(`Tentative nircmd: ${nircmdCommand}`);
        const { stdout, stderr } = await execAsync(nircmdCommand);
        console.log('✅ SUCCÈS avec nircmd pour touche');
        return;
      } catch (nircmdError) {
        console.log('❌ nircmd échoué pour touche, tentative AutoHotkey...', nircmdError instanceof Error ? nircmdError.message : String(nircmdError));
      }

             // MÉTHODE 2: AutoHotkey
       try {
         const ahkScript = `Send, ${value}`;
         const ahkFile = path.join(os.tmpdir(), `key-${Date.now()}.ahk`);
        
        await fs.promises.writeFile(ahkFile, ahkScript);
        
        console.log(`Tentative AutoHotkey pour touche: ${ahkFile}`);
        const { stdout, stderr } = await execAsync(`autohotkey "${ahkFile}"`);
        
        try {
          await fs.promises.unlink(ahkFile);
        } catch (cleanupError) {
          // Ignorer
        }
        
        console.log('✅ SUCCÈS avec AutoHotkey pour touche');
        return;
      } catch (ahkError) {
        console.log('❌ AutoHotkey échoué pour touche, tentative PowerShell...');
      }

             // MÉTHODE 3: PowerShell SendKeys
       try {
         const script = `
 Add-Type -AssemblyName System.Windows.Forms
 Start-Sleep -Milliseconds 1
 [System.Windows.Forms.SendKeys]::SendWait("${value}")
 `;

         const tempFile = path.join(os.tmpdir(), `keypress-${Date.now()}.ps1`);
        
        await fs.promises.writeFile(tempFile, script);
        
        const { stdout, stderr } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${tempFile}"`);
        
        try {
          await fs.promises.unlink(tempFile);
        } catch (cleanupError) {
          // Ignorer
        }
        
        console.log(`✅ SUCCÈS avec PowerShell pour touche ${value}`);
        return;
      } catch (psError) {
        console.log('❌ PowerShell échoué pour touche, tentative Python...');
      }

             // MÉTHODE 4: Python pyautogui
       try {
         const pythonScript = `
 import pyautogui
 pyautogui.press('${value}')
 `;
         
         const pyFile = path.join(os.tmpdir(), `key-${Date.now()}.py`);
        
        await fs.promises.writeFile(pyFile, pythonScript);
        
        console.log(`Tentative Python pour touche: ${pyFile}`);
        const { stdout, stderr } = await execAsync(`python "${pyFile}"`);
        
        try {
          await fs.promises.unlink(pyFile);
        } catch (cleanupError) {
          // Ignorer
        }
        
        console.log('✅ SUCCÈS avec Python pour touche');
        return;
      } catch (pyError) {
        throw new Error(`Toutes les méthodes ont échoué pour la touche: ${value}`);
      }
      
    } catch (error) {
      console.error('❌ ÉCHEC TOTAL pour touche:', error);
      throw new Error(`Erreur touche: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async executeType(payload: ActionPayload): Promise<void> {
    const { value } = payload;
    
    if (!value) {
      throw new Error('Texte requis');
    }

    console.log(`📝 EXÉCUTION DIRECTE - Saisie: "${value}"`);

    try {
             // MÉTHODE 1: nircmd pour saisie de texte (échappement des caractères spéciaux)
       try {
         const nircmdPath = path.join(__dirname, '../../tools/nircmd.exe');
        // Échapper les caractères spéciaux pour nircmd
        const escapedValue = value.replace(/"/g, '""');
        const nircmdCommand = `"${nircmdPath}" sendkeys "${escapedValue}"`;
        console.log(`Tentative nircmd pour texte: ${nircmdCommand}`);
        const { stdout, stderr } = await execAsync(nircmdCommand);
        console.log('✅ SUCCÈS avec nircmd pour saisie');
        return;
      } catch (nircmdError) {
        console.log('❌ nircmd échoué pour saisie, tentative AutoHotkey...', nircmdError instanceof Error ? nircmdError.message : String(nircmdError));
      }

             // MÉTHODE 2: AutoHotkey pour saisie (mode texte brut)
       try {
         // Utiliser SendRaw pour éviter l'interprétation des caractères spéciaux
         const ahkScript = `SendRaw, ${value}`;
         const ahkFile = path.join(os.tmpdir(), `type-${Date.now()}.ahk`);
        
        await fs.promises.writeFile(ahkFile, ahkScript, 'utf8');
        
        console.log(`Tentative AutoHotkey pour saisie: ${ahkFile}`);
        const { stdout, stderr } = await execAsync(`autohotkey "${ahkFile}"`);
        
        try {
          await fs.promises.unlink(ahkFile);
        } catch (cleanupError) {
          // Ignorer
        }
        
        console.log('✅ SUCCÈS avec AutoHotkey pour saisie');
        return;
      } catch (ahkError) {
        console.log('❌ AutoHotkey échoué pour saisie, tentative PowerShell...');
      }

             // MÉTHODE 3: PowerShell SendKeys pour saisie (échappement sécurisé)
       try {
         // Échapper les caractères spéciaux pour PowerShell
         const escapedValue = value
           .replace(/\\/g, '\\\\')
           .replace(/"/g, '""')
           .replace(/\r/g, '')
           .replace(/\n/g, '{ENTER}');
         
         const script = `
 Add-Type -AssemblyName System.Windows.Forms
 Start-Sleep -Milliseconds 1
 [System.Windows.Forms.SendKeys]::SendWait("${escapedValue}")
 `;

         const tempFile = path.join(os.tmpdir(), `type-${Date.now()}.ps1`);
        
        await fs.promises.writeFile(tempFile, script, 'utf8');
        
        const { stdout, stderr } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${tempFile}"`);
        
        try {
          await fs.promises.unlink(tempFile);
        } catch (cleanupError) {
          // Ignorer
        }
        
        console.log(`✅ SUCCÈS avec PowerShell pour saisie "${value}"`);
        return;
      } catch (psError) {
        console.log('❌ PowerShell échoué pour saisie, tentative Python...');
      }

             // MÉTHODE 4: Python pyautogui pour saisie
       try {
         // Échapper les caractères spéciaux pour Python
         const escapedValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
         
         const pythonScript = `
 # -*- coding: utf-8 -*-
 import pyautogui
 pyautogui.write('${escapedValue}')
 `;
         
         const pyFile = path.join(os.tmpdir(), `type-${Date.now()}.py`);
        
        await fs.promises.writeFile(pyFile, pythonScript, 'utf8');
        
        console.log(`Tentative Python pour saisie: ${pyFile}`);
        const { stdout, stderr } = await execAsync(`python "${pyFile}"`);
        
        try {
          await fs.promises.unlink(pyFile);
        } catch (cleanupError) {
          // Ignorer
        }
        
        console.log('✅ SUCCÈS avec Python pour saisie');
        return;
      } catch (pyError) {
        throw new Error(`Toutes les méthodes ont échoué pour la saisie: ${value}`);
      }
      
    } catch (error) {
      console.error('❌ ÉCHEC TOTAL pour saisie:', error);
      throw new Error(`Erreur saisie: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async executeWait(payload: ActionPayload): Promise<void> {
    const { delay = 1000 } = payload;
    await new Promise(resolve => setTimeout(resolve, delay));
    console.log(`✅ Attente de ${delay}ms terminée`);
  }

  static async executeMove(payload: ActionPayload): Promise<void> {
    const { coordinates } = payload;
    
    if (!coordinates) {
      throw new Error('Coordonnées requises');
    }

    const { x, y } = coordinates;
    
    console.log(`🖱️ Déplacement curseur vers (${x}, ${y})`);

    try {
      const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})
Start-Sleep -Milliseconds 5
`;

             // Utiliser un fichier temporaire pour éviter les problèmes d'échappement
       const tempFile = path.join(os.tmpdir(), `move-${Date.now()}.ps1`);
      
      await fs.promises.writeFile(tempFile, script);
      
      const { stdout, stderr } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${tempFile}"`);
      
      // Nettoyer le fichier temporaire
      try {
        await fs.promises.unlink(tempFile);
      } catch (cleanupError) {
        // Ignorer les erreurs de nettoyage
      }
      
      console.log(`✅ Curseur déplacé en (${x}, ${y}) avec succès`);
      if (stderr) console.log('Avertissement:', stderr);
    } catch (error) {
      console.error('❌ Erreur déplacement:', error);
      throw new Error(`Erreur déplacement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Fonction pour capturer la position RÉELLE de la souris
  static async getRealMousePosition(): Promise<{ x: number; y: number }> {
    try {
      console.log('🎯 Capture position avec PowerShell optimisé...');
      
      // Script PowerShell simplifié et plus fiable
      const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$pos = [System.Windows.Forms.Cursor]::Position
Write-Output "$($pos.X),$($pos.Y)"
`;
      
      // Créer un fichier temporaire pour éviter les problèmes d'échappement
      const tempFile = path.join(os.tmpdir(), `mousepos-${Date.now()}.ps1`);
      await fs.promises.writeFile(tempFile, psScript);
      
      const { stdout, stderr } = await execAsync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${tempFile}"`);
      
      // Nettoyer le fichier temporaire
      try {
        await fs.promises.unlink(tempFile);
      } catch (cleanupError) {
        // Ignorer
      }
      
      console.log('Sortie PowerShell brute:', JSON.stringify(stdout));
      
      // Nettoyer la sortie
      const cleanOutput = stdout.trim().replace(/\r?\n/g, '');
      console.log('Sortie nettoyée:', JSON.stringify(cleanOutput));
      
      if (!cleanOutput) {
        console.log('❌ Sortie vide, essai méthode alternative...');
        return await this.getMousePositionAlternative();
      }
      
      const parts = cleanOutput.split(',');
      
      if (parts.length !== 2) {
        console.error('Format inattendu, parties:', parts);
        console.log('❌ Tentative méthode alternative...');
        return await this.getMousePositionAlternative();
      }
      
      const x = parseInt(parts[0].trim());
      const y = parseInt(parts[1].trim());
      
      if (isNaN(x) || isNaN(y)) {
        console.error('Valeurs NaN:', { x, y, parts });
        console.log('❌ Tentative méthode alternative...');
        return await this.getMousePositionAlternative();
      }
      
      console.log(`✅ Position RÉELLE capturée: (${x}, ${y})`);
      return { x, y };
      
    } catch (error) {
      console.error('❌ Erreur capture position PowerShell:', error);
      console.log('📍 Tentative méthode alternative...');
      return await this.getMousePositionAlternative();
    }
  }

  // Méthode alternative pour capturer la position de la souris
  private static async getMousePositionAlternative(): Promise<{ x: number; y: number }> {
    try {
      console.log('🔄 Méthode alternative: nircmd...');
      
      // Utiliser nircmd comme fallback (plus fiable)
      const nircmdPath = path.join(__dirname, '../../tools/nircmd.exe');
      const { stdout } = await execAsync(`"${nircmdPath}" cursor`);
      
      // nircmd retourne "X Y" (sans virgule)
      const coords = stdout.trim().split(/\s+/);
      
      if (coords.length >= 2) {
        const x = parseInt(coords[0]);
        const y = parseInt(coords[1]);
        
        if (!isNaN(x) && !isNaN(y)) {
          console.log(`✅ Position nircmd capturée: (${x}, ${y})`);
          return { x, y };
        }
      }
      
      console.log('❌ nircmd échoué, essai méthode finale...');
      return await this.getMousePositionFinal();
      
    } catch (error) {
      console.error('❌ Erreur méthode nircmd:', error);
      return await this.getMousePositionFinal();
    }
  }

  // Méthode finale de secours
  private static async getMousePositionFinal(): Promise<{ x: number; y: number }> {
    try {
      console.log('🔄 Méthode finale: GetCursorPos via PowerShell...');
      
      const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);
    
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int X;
        public int Y;
    }
}
"@

$point = New-Object Win32+POINT
[Win32]::GetCursorPos([ref]$point)
Write-Output "$($point.X),$($point.Y)"
`;
      
      const tempFile = path.join(os.tmpdir(), `cursorpos-${Date.now()}.ps1`);
      await fs.promises.writeFile(tempFile, psScript);
      
      const { stdout } = await execAsync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${tempFile}"`);
      
      try {
        await fs.promises.unlink(tempFile);
      } catch (cleanupError) {
        // Ignorer
      }
      
      const cleanOutput = stdout.trim().replace(/\r?\n/g, '');
      const parts = cleanOutput.split(',');
      
      if (parts.length === 2) {
        const x = parseInt(parts[0].trim());
        const y = parseInt(parts[1].trim());
        
        if (!isNaN(x) && !isNaN(y)) {
          console.log(`✅ Position finale capturée: (${x}, ${y})`);
          return { x, y };
        }
      }
      
      // Si tout échoue, retourner la position actuelle du curseur (0,0)
      console.log('❌ Toutes les méthodes ont échoué, retour (0,0)');
      return { x: 0, y: 0 };
      
    } catch (error) {
      console.error('❌ Erreur méthode finale:', error);
      return { x: 0, y: 0 };
    }
  }
}
