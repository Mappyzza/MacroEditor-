import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

export interface ActionPayload {
  type: 'click' | 'keypress' | 'type' | 'wait' | 'move' | 'scroll' | 'integration';
  coordinates?: { x: number; y: number };
  value?: string;
  delay?: number;
  button?: 'left' | 'right';
  clickCount?: number;
  integrationMacroId?: string;
  integrationMacroVersion?: string;
  repeatCount?: number;
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
      case 'integration':
        await this.executeIntegration(payload);
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
    
    console.log(`🎯 EXÉCUTION DIRECTE - Payload reçu:`, payload);
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

# Positionnement instantané du curseur

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);
}
"@

`;
      
      // Ajouter tous les clics avec délai minimal pour distinguer les clics
      for (let i = 0; i < clickCount; i++) {
        psScript += `[Win32]::mouse_event(${leftDown}, 0, 0, 0, 0); Start-Sleep -Milliseconds 1; [Win32]::mouse_event(${leftUp}, 0, 0, 0, 0)\n`;
        if (i < clickCount - 1) {
          psScript += `Start-Sleep -Milliseconds 2\n`; // Délai minimal de 2ms entre clics pour distinguer
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
        
        // Positionner le curseur et exécuter les clics INSTANTANÉMENT
        await execAsync(`"${nircmdPath}" setcursor ${x} ${y}`);
        const clickType = button === 'left' ? 'left' : 'right';
        for (let i = 0; i < clickCount; i++) {
          await execAsync(`"${nircmdPath}" sendmouse ${clickType} click`);
          if (i < clickCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 2)); // Délai minimal de 2ms entre clics
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

  // Fonction pour mapper les codes de touches vers les formats appropriés pour chaque méthode
  private static mapKeyForMethod(key: string, method: 'nircmd' | 'autohotkey' | 'powershell' | 'python'): string | null {
    // Mapping des touches spéciales vers les formats appropriés
    const keyMappings: { [key: string]: { [method: string]: string } } = {
      '{ENTER}': {
        'nircmd': 'enter',
        'autohotkey': '{Enter}',
        'powershell': '{ENTER}',
        'python': 'enter'
      },
      '{BACKSPACE}': {
        'nircmd': 'backspace',
        'autohotkey': '{Backspace}',
        'powershell': '{BACKSPACE}',
        'python': 'backspace'
      },
      '{TAB}': {
        'nircmd': 'tab',
        'autohotkey': '{Tab}',
        'powershell': '{TAB}',
        'python': 'tab'
      },
      '{ESC}': {
        'nircmd': 'escape',
        'autohotkey': '{Esc}',
        'powershell': '{ESC}',
        'python': 'esc'
      },
      '{CAPSLOCK}': {
        'nircmd': 'capslock',
        'autohotkey': '{CapsLock}',
        'powershell': '{CAPSLOCK}',
        'python': 'capslock'
      },
      '{SHIFT}': {
        'nircmd': 'shift',
        'autohotkey': '{Shift}',
        'powershell': '{SHIFT}',
        'python': 'shift'
      },
      '{CTRL}': {
        'nircmd': 'ctrl',
        'autohotkey': '{Ctrl}',
        'powershell': '{CTRL}',
        'python': 'ctrl'
      },
      '{ALT}': {
        'nircmd': 'alt',
        'autohotkey': '{Alt}',
        'powershell': '{ALT}',
        'python': 'alt'
      },
      '{LWIN}': {
        'nircmd': 'win',
        'autohotkey': '{LWin}',
        'powershell': '{LWIN}',
        'python': 'win'
      },
      '{APPS}': {
        'nircmd': 'apps',
        'autohotkey': '{AppsKey}',
        'powershell': '{APPS}',
        'python': 'menu'
      }
    };

    // Si c'est une touche spéciale mappée, retourner le format approprié
    if (keyMappings[key] && keyMappings[key][method]) {
      return keyMappings[key][method];
    }

    // Si c'est une combinaison avec des modificateurs (^, !, +, #)
    if (key.includes('^') || key.includes('!') || key.includes('+') || key.includes('#')) {
      let mappedKey = key;
      
      // Mapper les modificateurs pour AutoHotkey
      if (method === 'autohotkey') {
        mappedKey = key.replace(/\^/g, '^').replace(/!/g, '!').replace(/\+/g, '+').replace(/#/g, '#');
      }
      // Mapper les modificateurs pour PowerShell
      else if (method === 'powershell') {
        mappedKey = key.replace(/\^/g, '^').replace(/!/g, '%').replace(/\+/g, '+').replace(/#/g, '#');
      }
      // Pour nircmd, convertir les combinaisons en format nircmd
      else if (method === 'nircmd') {
        // nircmd ne supporte pas les combinaisons directement, on retourne null pour forcer le fallback
        return null;
      }
      // Pour python, on garde le format tel quel
      
      return mappedKey;
    }

    // Pour les touches normales, retourner tel quel
    return key;
  }

  static async executeKeypress(payload: ActionPayload): Promise<void> {
    const { value } = payload;
    
    if (!value) {
      throw new Error('Valeur de touche requise');
    }

    console.log(`⌨️ EXÉCUTION DIRECTE - Touche: ${value}`);

    try {
             // MÉTHODE 1: Utiliser nircmd (seulement pour les touches simples)
       try {
         const nircmdPath = path.join(__dirname, '../../tools/nircmd.exe');
        const mappedKey = this.mapKeyForMethod(value, 'nircmd');
        
        // Si nircmd ne peut pas gérer cette touche (combinaisons), passer à la méthode suivante
        if (mappedKey === null) {
          console.log('⚠️ nircmd ne supporte pas cette combinaison, passage à AutoHotkey...');
          throw new Error('Combinaison non supportée par nircmd');
        }
        
        const nircmdCommand = `"${nircmdPath}" sendkeypress ${mappedKey}`;
        console.log(`Tentative nircmd: ${nircmdCommand}`);
        const { stdout, stderr } = await execAsync(nircmdCommand);
        console.log('✅ SUCCÈS avec nircmd pour touche');
        return;
      } catch (nircmdError) {
        console.log('❌ nircmd échoué pour touche, tentative AutoHotkey...', nircmdError instanceof Error ? nircmdError.message : String(nircmdError));
      }

             // MÉTHODE 2: AutoHotkey
       try {
         const mappedKey = this.mapKeyForMethod(value, 'autohotkey');
         const ahkScript = `Send, ${mappedKey}`;
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
         const mappedKey = this.mapKeyForMethod(value, 'powershell');
         const script = `
 Add-Type -AssemblyName System.Windows.Forms
 Start-Sleep -Milliseconds 1
 [System.Windows.Forms.SendKeys]::SendWait("${mappedKey}")
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
         const mappedKey = this.mapKeyForMethod(value, 'python');
         const pythonScript = `
 import pyautogui
 pyautogui.press('${mappedKey}')
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

    // Utiliser une seule méthode pour éviter la duplication
    // Priorité: PowerShell SendKeys (le plus fiable pour la saisie de texte)
    try {
      // Échapper les caractères spéciaux pour PowerShell
      const escapedValue = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '""')
        .replace(/\r/g, '')
        .replace(/\n/g, '{ENTER}');
      
      const script = `
Add-Type -AssemblyName System.Windows.Forms
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
      console.log('❌ PowerShell échoué pour saisie, tentative nircmd...');
    }

    // Méthode de fallback: nircmd
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

    // Dernière méthode de fallback: AutoHotkey
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
      throw new Error(`Toutes les méthodes ont échoué pour la saisie: ${value}`);
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

  static async executeIntegration(payload: ActionPayload): Promise<void> {
    const { integrationMacroId, repeatCount = 1 } = payload;
    
    console.log(`🔍 [DEBUG] executeIntegration appelé avec:`, { integrationMacroId, repeatCount });
    
    if (!integrationMacroId) {
      console.error(`❌ [DEBUG] integrationMacroId manquant`);
      throw new Error('ID de macro d\'intégration requis');
    }

    try {
      console.log(`🔗 [DEBUG] Début exécution intégration: ${integrationMacroId} (${repeatCount} fois)`);
      
      // Utiliser le système de simulation qui fonctionne déjà
      const { BrowserWindow } = require('electron');
      console.log(`🔍 [DEBUG] BrowserWindow importé`);
      
      const mainWindow = BrowserWindow.getAllWindows()[0];
      console.log(`🔍 [DEBUG] Fenêtres trouvées:`, BrowserWindow.getAllWindows().length);
      
      if (!mainWindow) {
        console.error(`❌ [DEBUG] Aucune fenêtre principale trouvée`);
        throw new Error('Fenêtre principale introuvable');
      }

      console.log(`🔍 [DEBUG] Fenêtre principale trouvée, envoi message get-integration-macro`);
      
      // Envoyer un message au renderer pour exécuter la simulation de l'intégration
      // On va utiliser execute-macro directement depuis le main process
      const { ipcMain } = require('electron');
      
      // Simuler un appel IPC pour exécuter la macro intégrée
      const result = await new Promise((resolve, reject) => {
        console.log(`🔍 [DEBUG] Création Promise pour récupération macro`);
        
        // Envoyer le message au renderer pour récupérer la macro intégrée
        mainWindow.webContents.send('get-integration-macro', { 
          integrationMacroId 
        });
        console.log(`🔍 [DEBUG] Message get-integration-macro envoyé`);
        
        // Attendre la réponse avec la macro
        const responseHandler = (event: any, macroData: any) => {
          console.log(`🔍 [DEBUG] Réponse reçue:`, { macroData: macroData ? 'présent' : 'null' });
          ipcMain.removeListener('integration-macro-data', responseHandler);
          if (macroData) {
            console.log(`✅ [DEBUG] Macro trouvée:`, macroData.name);
            resolve(macroData);
          } else {
            console.error(`❌ [DEBUG] Macro non trouvée`);
            reject(new Error('Macro d\'intégration introuvable'));
          }
        };

        ipcMain.on('integration-macro-data', responseHandler);
        console.log(`🔍 [DEBUG] Listener integration-macro-data ajouté`);

        // Timeout de sécurité
        setTimeout(() => {
          console.error(`❌ [DEBUG] Timeout atteint (5s)`);
          ipcMain.removeListener('integration-macro-data', responseHandler);
          reject(new Error('Timeout lors de la récupération de la macro d\'intégration'));
        }, 5000);
      });
      
      console.log(`🔍 [DEBUG] Macro récupérée, début exécution ${repeatCount} fois`);
      
      // Exécuter la macro intégrée le nombre de fois spécifié
      for (let i = 0; i < repeatCount; i++) {
        console.log(`🔄 [DEBUG] Exécution ${i + 1}/${repeatCount} de la macro intégrée`);
        await this.executeMacro(result);
        console.log(`✅ [DEBUG] Exécution ${i + 1}/${repeatCount} terminée`);
      }
      
      console.log(`✅ [DEBUG] Intégration ${integrationMacroId} simulée avec succès`);
    } catch (error) {
      console.error(`❌ [DEBUG] Erreur dans executeIntegration:`, error);
      throw new Error(`Erreur intégration: ${error}`);
    }
  }

  static async executeMacro(macroData: any): Promise<void> {
    try {
      console.log('🎯 [DEBUG] EXÉCUTION MACRO - Macro:', macroData.name);
      
      if (!macroData.actions || !Array.isArray(macroData.actions)) {
        console.error('❌ [DEBUG] Aucune action trouvée dans la macro');
        return;
      }

      console.log(`📋 [DEBUG] Exécution de ${macroData.actions.length} actions...`);

      // Exécuter chaque action de la macro
      for (let i = 0; i < macroData.actions.length; i++) {
        const action = macroData.actions[i];
        console.log(`🔄 [DEBUG] Action ${i + 1}/${macroData.actions.length}: ${action.type}`);

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
          
          console.log(`🔍 [DEBUG] Action payload:`, actionPayload);
          await this.executeAction(actionPayload);
          console.log(`✅ [DEBUG] Action ${i + 1} terminée avec succès`);
        } catch (actionError) {
          console.error(`❌ [DEBUG] Erreur action ${i + 1}:`, actionError);
          throw actionError;
        }
      }

      console.log('🎉 [DEBUG] Macro exécutée avec succès !');
    } catch (error) {
      console.error('❌ [DEBUG] Erreur lors de l\'exécution de la macro:', error);
      throw error;
    }
  }
}
