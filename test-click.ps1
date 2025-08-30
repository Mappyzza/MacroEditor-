Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Write-Host "Test de clic dans 3 secondes..."
Start-Sleep -Seconds 3

# Déplacer le curseur au centre de l'écran
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(500, 500)
Write-Host "Curseur déplacé à (500, 500)"
Start-Sleep -Milliseconds 100

# Simuler un clic gauche avec la méthode Windows Forms
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class MouseAPI {
    [DllImport("user32.dll")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
}
"@

Write-Host "Clic gauche..."
[MouseAPI]::mouse_event(2, 0, 0, 0, 0) # LEFTDOWN
Start-Sleep -Milliseconds 50
[MouseAPI]::mouse_event(4, 0, 0, 0, 0) # LEFTUP

Write-Host "Test terminé !"
