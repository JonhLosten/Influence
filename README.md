
# InfluenceOps 🧠
Tableau de bord multi-réseaux (Instagram, Facebook, TikTok, YouTube).  
**Desktop** via Electron, **UI** React + Vite + Tailwind, **API** locale Express.  
**Langues** : Français (par défaut) et Anglais — réglable dans *Paramètres* (préférence mémorisée).

## 🚀 Démarrage (Windows)
1. Installer Node.js (≥ 20) et npm.
2. Copier ce dossier, ouvrir un terminal dans le dossier.
3. Copier `.env.example` en `.env` et mettre votre clé Ayrshare (optionnel pour démo).
4. Installer : `npm install`
5. Dev : `npm run dev` (l'app Electron s'ouvre automatiquement)
6. Build .exe : `npm run make` (installeur dans `out/`)

> Sans clé Ayrshare, l'app fonctionne en **mode démo** (données factices).

## 🔐 Configuration
- Créez un compte Ayrshare et récupérez votre **API Key**.
- Placez-la dans `.env` → `AYRSHARE_API_KEY=...`

## 🌐 Langues
- Par défaut : **Français**.
- Changez la langue dans **Paramètres** → la préférence est enregistrée (localStorage) et appliquée à chaque lancement.

## 🧭 Navigation
- **Tableau de bord** : synthèse globale + top contenus.
- **Réseaux** : Instagram, Facebook, TikTok, YouTube.
- **Paramètres** : langue (FR/EN).

## 📦 Scripts utiles
- `npm run dev` : serveur API + Vite + Electron.
- `npm run make` : build production (.exe).
- `npm run build:web` : génère la version statique Vite (utilisée pour `gh-pages`).

## 🌍 Publication web
- Chaque `push` sur `main` ou `work` déclenche une action GitHub qui :
  - installe les dépendances,
  - exécute `npm run build:web`,
  - publie automatiquement le contenu du dossier `dist/` sur la branche `gh-pages`.
- Un déclenchement manuel est possible via l'onglet **Actions** → *Deploy to GitHub Pages*.
