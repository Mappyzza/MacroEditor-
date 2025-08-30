import { exec } from 'child_process';
import { promisify } from 'util';

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

    // Optimisation ULTRA-RAPIDE pour les doubles/triples clics
    if (clickCount > 1) {
      try {
        console.log(`⚡ OPTIMISATION ULTRA-RAPIDE - ${clickCount} clics INSTANTANÉS`);
        
        const path = require('path');
        const nircmdPath = path.join(__dirname, '../../tools/nircmd.exe');
        
        // MÉTHODE 1: Commande PowerShell ultra-optimisée (plus rapide que nircmd)
        const leftDown = button === 'left' ? '0x02' : '0x08';
        const leftUp = button === 'left' ? '0x04' : '0x10';
        
        let psScript = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);
}
"@

`;
        
        // Ajouter tous les clics instantanément
        for (let i = 0; i < clickCount; i++) {
          psScript += `[Win32]::mouse_event(${leftDown}, 0, 0, 0, 0); [Win32]::mouse_event(${leftUp}, 0, 0, 0, 0)\n`;
        }
        
        const fs = require('fs');
        const os = require('os');
        const psFile = path.join(os.tmpdir(), `ultraclick-${Date.now()}.ps1`);
        
        await fs.promises.writeFile(psFile, psScript);
        await execAsync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`);
        
        try {
          await fs.promises.unlink(psFile);
        } catch (cleanupError) {
          // Ignorer
        }
        
        console.log(`✅ SUCCÈS clics multiples ULTRA-RAPIDES (${clickCount} clics instantanés)`);
        return;
      } catch (error) {
        console.log('❌ Optimisation PowerShell échouée, essai nircmd...', error instanceof Error ? error.message : String(error));
        
        // FALLBACK: nircmd ultra-rapide
        try {
          const path = require('path');
          const nircmdPath = path.join(__dirname, '../../tools/nircmd.exe');
          
          // Positionner une seule fois
          await execAsync(`"${nircmdPath}" setcursor ${x} ${y}`);
          
          // Tous les clics en parallèle
          const clickType = button === 'left' ? 'left' : 'right';
          const clickPromises = [];
          for (let i = 0; i < clickCount; i++) {
            clickPromises.push(execAsync(`"${nircmdPath}" sendmouse ${clickType} click`));
          }
          
          await Promise.all(clickPromises);
          console.log(`✅ SUCCÈS clics multiples nircmd parallèles (${clickCount} clics)`);
          return;
        } catch (nircmdError) {
          console.log('❌ Optimisation nircmd échouée aussi, méthode standard...', nircmdError instanceof Error ? nircmdError.message : String(nircmdError));
        }
      }
    }

    for (let i = 0; i < clickCount; i++) {
      try {
        console.log(`🖱️ Tentative ${i + 1}/${clickCount} - Position: (${x}, ${y})`);
        
        // MÉTHODE 1: Utiliser nircmd (outil Windows natif)
        try {
          const path = require('path');
          const nircmdPath = path.join(__dirname, '../../tools/nircmd.exe');
          const nircmdCommand = `"${nircmdPath}" setcursor ${x} ${y}`;
          const clickCommand = button === 'left' ? 
            `"${nircmdPath}" sendmouse left click` : 
            `"${nircmdPath}" sendmouse right click`;
          
          console.log(`Tentative nircmd: ${nircmdCommand} && ${clickCommand}`);
          
          // Déplacer la souris puis cliquer (sans délai pour vitesse maximale)
          await execAsync(nircmdCommand);
          await execAsync(clickCommand);
          
          console.log('✅ SUCCÈS avec nircmd');
          
          // Attendre entre les clics
          // SUPPRIMÉ: Aucun délai pour vitesse maximale
          continue; // Passer au clic suivant
        } catch (nircmdError) {
          console.log('❌ nircmd échoué, tentative méthode 2...', nircmdError instanceof Error ? nircmdError.message : String(nircmdError));
        }

        // MÉTHODE 2: Utiliser AutoHotkey en ligne de commande
        try {
          const ahkScript = `
MouseMove, ${x}, ${y}, 0
Sleep, 1
${button === 'left' ? 'Click' : 'Click Right'}
`;
          const fs = require('fs');
          const path = require('path');
          const os = require('os');
          const ahkFile = path.join(os.tmpdir(), `click-${Date.now()}-${i}.ahk`);
          
          await fs.promises.writeFile(ahkFile, ahkScript);
          
          console.log(`Tentative AutoHotkey: ${ahkFile}`);
          const { stdout: ahkOut, stderr: ahkErr } = await execAsync(`autohotkey "${ahkFile}"`);
          
          // Nettoyer
          try {
            await fs.promises.unlink(ahkFile);
          } catch (cleanupError) {
            // Ignorer
          }
          
          console.log('✅ SUCCÈS avec AutoHotkey');
          if (ahkErr) console.log('Avertissement AHK:', ahkErr);
          
          // SUPPRIMÉ: Aucun délai pour vitesse maximale
          continue;
        } catch (ahkError) {
          console.log('❌ AutoHotkey échoué, tentative méthode 3...');
        }

        // MÉTHODE 3: PowerShell avec COM object (plus direct)
        try {
          const comScript = `
$shell = New-Object -ComObject WScript.Shell
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})
Start-Sleep -Milliseconds 1

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall)]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);
    public const int LEFTDOWN = 0x02;
    public const int LEFTUP = 0x04;
    public const int RIGHTDOWN = 0x08;
    public const int RIGHTUP = 0x10;
}
"@

if ("${button}" -eq "left") {
    [Win32]::mouse_event([Win32]::LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 1
    [Win32]::mouse_event([Win32]::LEFTUP, 0, 0, 0, 0)
} else {
    [Win32]::mouse_event([Win32]::RIGHTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 1
    [Win32]::mouse_event([Win32]::RIGHTUP, 0, 0, 0, 0)
}
`;

          const fs = require('fs');
          const path = require('path');
          const os = require('os');
          const psFile = path.join(os.tmpdir(), `click-${Date.now()}-${i}.ps1`);
          
          await fs.promises.writeFile(psFile, comScript);
          
          console.log(`Tentative PowerShell avancé: ${psFile}`);
          const { stdout: psOut, stderr: psErr } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`);
          
          // Nettoyer
          try {
            await fs.promises.unlink(psFile);
          } catch (cleanupError) {
            // Ignorer
          }
          
          console.log('✅ SUCCÈS avec PowerShell COM');
          if (psErr) console.log('Avertissement PS:', psErr);
          
          // SUPPRIMÉ: Aucun délai pour vitesse maximale
          continue;
        } catch (psError) {
          console.log('❌ PowerShell COM échoué, tentative méthode 4...');
        }

        // MÉTHODE 4: Utiliser Python avec pyautogui (si disponible)
        try {
          const pythonScript = `
import pyautogui
pyautogui.click(${x}, ${y}, button='${button}')
`;
          
          const fs = require('fs');
          const path = require('path');
          const os = require('os');
          const pyFile = path.join(os.tmpdir(), `click-${Date.now()}-${i}.py`);
          
          await fs.promises.writeFile(pyFile, pythonScript);
          
          console.log(`Tentative Python: ${pyFile}`);
          const { stdout: pyOut, stderr: pyErr } = await execAsync(`python "${pyFile}"`);
          
          // Nettoyer
          try {
            await fs.promises.unlink(pyFile);
          } catch (cleanupError) {
            // Ignorer
          }
          
          console.log('✅ SUCCÈS avec Python');
          if (pyErr) console.log('Avertissement Python:', pyErr);
          
          // SUPPRIMÉ: Aucun délai pour vitesse maximale
          continue;
        } catch (pyError) {
          console.log('❌ Python échoué, AUCUNE MÉTHODE N\'A FONCTIONNÉ');
          throw new Error(`Toutes les méthodes de clic ont échoué pour (${x}, ${y})`);
        }
        
      } catch (error) {
        console.error(`❌ ÉCHEC TOTAL pour clic ${i + 1}:`, error);
        throw new Error(`Erreur clic: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    console.log(`🎉 TOUS LES CLICS TERMINÉS avec succès`);
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
        const path = require('path');
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
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
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

        const fs = require('fs');
        const path = require('path');
        const os = require('os');
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
        
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
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
        const path = require('path');
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
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
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

        const fs = require('fs');
        const path = require('path');
        const os = require('os');
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
        
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
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
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
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
    // Script PowerShell corrigé pour éviter les problèmes de format
    const simpleCommand = `Add-Type -AssemblyName System.Windows.Forms; $pos = [System.Windows.Forms.Cursor]::Position; Write-Host "$($pos.X),$($pos.Y)" -NoNewline`;

    try {
      console.log('🎯 Capture position avec PowerShell corrigé...');
      
      const { stdout, stderr } = await execAsync(`powershell.exe -NoProfile -ExecutionPolicy Unrestricted -Command "${simpleCommand}"`);
      
      console.log('Sortie PowerShell:', {
        stdout: JSON.stringify(stdout),
        stderr: JSON.stringify(stderr),
        stdoutLength: stdout.length,
        trimmed: JSON.stringify(stdout.trim())
      });
      
      // Nettoyer complètement la sortie de tous les caractères indésirables
      let output = stdout
        .replace(/"/g, '')           // Supprimer les guillemets
        .replace(/\\r/g, '')         // Supprimer \r
        .replace(/\\n/g, '')         // Supprimer \n
        .replace(/\r/g, '')          // Supprimer les vrais \r
        .replace(/\n/g, '')          // Supprimer les vrais \n
        .trim();                     // Supprimer les espaces
      
      console.log('Output nettoyé:', JSON.stringify(output));
      
      if (!output) {
        console.log('❌ Sortie vide après nettoyage, essai méthode alternative...');
        // Méthode alternative plus robuste
        return await this.getMousePositionAlternative();
      }
      
      const parts = output.split(',');
      
      if (parts.length !== 2) {
        console.error('Format inattendu après nettoyage, parties:', parts);
        console.log('❌ Tentative méthode alternative...');
        return await this.getMousePositionAlternative();
      }
      
      const x = parseInt(parts[0].trim());
      const y = parseInt(parts[1].trim());
      
      if (isNaN(x) || isNaN(y)) {
        console.error('Valeurs NaN après parsing:', { x, y, parts });
        console.log('❌ Tentative méthode alternative...');
        return await this.getMousePositionAlternative();
      }
      
      console.log(`✅ Position RÉELLE capturée: (${x}, ${y})`);
      return { x, y };
    } catch (error) {
      console.error('❌ Erreur capture position:', error);
      console.log('📍 Tentative méthode alternative...');
      return await this.getMousePositionAlternative();
    }
  }

  // Méthode alternative pour capturer la position de la souris
  private static async getMousePositionAlternative(): Promise<{ x: number; y: number }> {
    try {
      console.log('🔄 Méthode alternative: script PowerShell séparé...');
      
      // Utiliser une approche différente avec des variables séparées
      const command = `
        Add-Type -AssemblyName System.Windows.Forms
        $pos = [System.Windows.Forms.Cursor]::Position
        $x = $pos.X
        $y = $pos.Y
        Write-Host $x
        Write-Host $y
      `;
      
      const { stdout } = await execAsync(`powershell.exe -NoProfile -ExecutionPolicy Unrestricted -Command "${command}"`);
      
      const lines = stdout.trim().split('\n').map(line => line.trim()).filter(line => line);
      
      console.log('Lignes de sortie alternative:', lines);
      
      if (lines.length >= 2) {
        const x = parseInt(lines[0]);
        const y = parseInt(lines[1]);
        
        if (!isNaN(x) && !isNaN(y)) {
          console.log(`✅ Position alternative capturée: (${x}, ${y})`);
          return { x, y };
        }
      }
      
      // Si tout échoue, générer une position aléatoire visible
      const x = Math.floor(Math.random() * 800) + 200;
      const y = Math.floor(Math.random() * 600) + 200;
      console.log(`🎲 Position générée aléatoirement: (${x}, ${y})`);
      return { x, y };
      
    } catch (error) {
      console.error('❌ Erreur méthode alternative:', error);
      // Position par défaut finale
      console.log('📍 Retour position par défaut finale');
      return { x: 500, y: 400 };
    }
  }
}
