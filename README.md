# Éditeur de Macro

Un logiciel d'édition de macros moderne et intuitif construit avec Electron, React et TypeScript.

## 🎯 Fonctionnalités

- **Interface moderne** : Interface utilisateur élégante et responsive
- **Éditeur visuel** : Création et édition de macros avec un éditeur graphique
- **Bibliothèque d'actions** : Actions prédéfinies (clic, saisie, touches, attente, etc.)
- **Enregistrement en temps réel** : Enregistrement automatique des actions utilisateur
- **Exécution de macros** : Lecture et exécution des macros créées
- **Gestion de projets** : Sauvegarde et chargement de projets de macros
- **Journal d'exécution** : Suivi en temps réel de l'exécution des macros

## 🚀 Installation et lancement

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation
```bash
# Cloner le projet
cd MacroEditor

# Installer les dépendances
npm install

# Construire l'application
npm run build-dev

# Lancer l'application
npm run electron
```

### Scripts disponibles

```bash
# Développement
npm run dev           # Serveur de développement Webpack
npm run build-dev     # Build de développement
npm run electron-dev  # Build + lancement Electron

# Production
npm run build         # Build de production
npm run start         # Build + lancement
npm run electron      # Lancement Electron seulement
```

## 🎬 Types d'actions supportées

### Actions de souris
- **Clic** : Cliquer à des coordonnées spécifiques
- **Déplacement** : Déplacer le curseur vers une position

### Actions de clavier
- **Touche** : Appuyer sur une touche spécifique (Entrée, Tab, Flèches, etc.)
- **Saisie** : Taper du texte

### Actions de contrôle
- **Attente** : Pause pendant un délai défini
- **Défilement** : Faire défiler dans une direction

## 🖥️ Interface utilisateur

### Barre d'outils principale
- Bouton d'enregistrement pour capturer les actions en temps réel
- Accès à la bibliothèque d'actions
- Indicateurs d'état (enregistrement, exécution)

### Panneau latéral
- Liste des macros du projet
- Recherche et filtrage
- Création/suppression de macros

### Éditeur central
- Édition du nom et description de la macro
- Liste des actions avec réorganisation
- Contrôles pour modifier/supprimer les actions

### Bibliothèque d'actions
- Sélection des types d'actions
- Configuration des paramètres
- Ajout rapide d'actions

## 📁 Structure du projet

```
MacroEditor/
├── src/
│   ├── main/           # Processus principal Electron
│   │   └── main.ts
│   ├── renderer/       # Interface utilisateur React
│   │   ├── components/ # Composants React
│   │   ├── styles/     # Feuilles de style CSS
│   │   ├── App.tsx     # Composant principal
│   │   └── index.tsx   # Point d'entrée
│   └── types/          # Définitions TypeScript
│       └── macro.ts
├── dist/               # Fichiers compilés
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## 🔧 Configuration

### TypeScript
Le projet utilise TypeScript avec une configuration stricte pour assurer la qualité du code.

### Webpack
Configuration Webpack pour le bundling de l'interface React avec support du CSS et TypeScript.

### Electron
Configuration Electron avec processus principal et rendu séparés pour la sécurité.

## 📝 Utilisation

### 1. Créer une nouvelle macro
1. Cliquez sur "Nouveau" dans la barre latérale
2. Donnez un nom à votre macro
3. Ajoutez une description (optionnelle)

### 2. Ajouter des actions
**Méthode 1 - Bibliothèque d'actions :**
1. Ouvrez la bibliothèque d'actions
2. Sélectionnez un type d'action
3. Configurez les paramètres
4. Cliquez sur "Ajouter l'action"

**Méthode 2 - Enregistrement :**
1. Cliquez sur "Enregistrer" dans la barre d'outils
2. Effectuez les actions sur votre système
3. Cliquez sur "Arrêter" pour terminer l'enregistrement

### 3. Exécuter une macro
1. Sélectionnez la macro à exécuter
2. Utilisez le menu "Macro > Exécuter" ou appuyez sur F5
3. Suivez le progrès dans la fenêtre d'exécution

### 4. Sauvegarder le projet
- **Ctrl+S** : Sauvegarde rapide
- **Ctrl+Shift+S** : Sauvegarder sous...
- **Ctrl+O** : Ouvrir un projet existant

## 🔒 Sécurité

L'application utilise Electron avec `nodeIntegration` activé pour accéder aux APIs système nécessaires à l'automatisation. En production, il est recommandé d'implémenter des mesures de sécurité supplémentaires.

## 🛠️ Technologies utilisées

- **Electron** : Framework pour applications de bureau
- **React 18** : Bibliothèque d'interface utilisateur
- **TypeScript** : Typage statique pour JavaScript
- **Webpack** : Bundler pour l'application web
- **CSS Modules** : Styles modulaires et maintenables

## 📋 Fonctionnalités à venir

- [ ] Enregistrement réel des actions système (hooks Windows/macOS/Linux)
- [ ] Conditions et boucles dans les macros
- [ ] Variables et paramètres dynamiques
- [ ] Planification automatique des macros
- [ ] Export/import de macros individuelles
- [ ] Thèmes personnalisables
- [ ] Raccourcis clavier globaux

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Soumettre des pull requests

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🆘 Support

Si vous rencontrez des problèmes ou avez des questions :
1. Vérifiez que Node.js et npm sont installés correctement
2. Assurez-vous que toutes les dépendances sont installées (`npm install`)
3. Consultez les logs dans la console pour les erreurs détaillées

---

**Note** : Cette version est un prototype démontrant les concepts de base. L'implémentation réelle de l'automatisation système nécessiterait des bibliothèques natives spécifiques à chaque plateforme.
