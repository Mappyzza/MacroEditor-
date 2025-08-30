// Test simple des actions système
const { exec } = require('child_process');

console.log('Test des actions système...');

// Test 1: Déplacer le curseur
const moveScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(500, 400)
Write-Host "Curseur déplacé en (500, 400)"
`;

exec(`powershell -ExecutionPolicy Bypass -Command "${moveScript}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('Erreur déplacement:', error.message);
  } else {
    console.log('Déplacement réussi:', stdout);
  }
  
  // Test 2: Clic simple
  const clickScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class MouseAPI {
    [DllImport("user32.dll")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
}
"@
Write-Host "Clic gauche..."
[MouseAPI]::mouse_event(2, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[MouseAPI]::mouse_event(4, 0, 0, 0, 0)
Write-Host "Clic terminé"
`;

  exec(`powershell -ExecutionPolicy Bypass -Command "${clickScript}"`, (error2, stdout2, stderr2) => {
    if (error2) {
      console.error('Erreur clic:', error2.message);
    } else {
      console.log('Clic réussi:', stdout2);
    }
    console.log('Tests terminés');
  });
});
