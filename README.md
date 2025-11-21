# InfluenceOps 🧠

Tableau de bord multi-réseaux pour la publication et le suivi de contenu vidéo.

- **Desktop** via Electron (processus principal + preload sécurisés)
- **UI** React + Vite + Tailwind (renderer sandboxé)
- **API locale** HTTP (Express-like) validée avec Zod
- **Monorepo TypeScript** propulsé par Turborepo & workspaces
- **Base de données locale** SQLite avec Drizzle ORM (WAL activé, migrations)
- **CI/CD robuste** avec GitHub Actions (tests, packaging multi-OS, auto-update via `release-please`)
- **Gestion d'erreurs exemplaire** avec codes d'erreurs structurés et messages utilisateur clairs
- **Logging** avec Pino (server) et Electron-log (desktop)
- **Surveillance d'erreurs** (opt-in) avec Sentry

## 🚀 Installation

1.  **Prérequis :** Installer [Node.js](https://nodejs.org/en/) (version `>= 20.19.0` ou `>= 22.12.0` recommandée pour Storybook).
2.  **Cloner le dépôt :** `git clone https://github.com/JonhLosten/Influence.git`
3.  **Installer les dépendances :** Naviguer vers le répertoire cloné et exécuter `npm install`. Les workspaces seront reliés automatiquement par Turborepo.
4.  **(Optionnel) Configuration des variables d'environnement :**
    - Copier `.env.example` vers `.env` dans `apps/server/` et `apps/desktop/`.
    - Remplacer `your_ayrshare_api_key_here` par votre clé API Ayrshare dans `apps/server/.env` pour activer la publication réelle.
    - Remplacer `your_sentry_dsn_for_electron_main_process` et `your_sentry_dsn_for_node_server` dans `apps/desktop/.env` et `apps/server/.env` respectivement, si vous souhaitez activer la surveillance d'erreurs Sentry.
    - Pour activer Sentry, mettez `ENABLE_SENTRY_CRASH_REPORTING=true` dans les fichiers `.env` correspondants.

> 💡 **Mode Démo :** Sans clé Ayrshare, l'application fonctionne en **mode démo** (données factices, publication simulée). L'API locale fonctionnera avec une base de données SQLite en mémoire pour les tests.

## 🛠️ Développement

### Lancer l'application en développement

1.  **Lancer l'API locale :**

    ```bash
    npm run dev --workspace=apps/server
    ```

    Cette commande lancera le serveur Express sur `http://localhost:3000`.

2.  **Lancer l'application Electron :**

    ```bash
    npm run dev --workspace=apps/desktop
    ```

    Ceci lancera l'application Electron avec le renderer React/Vite.

3.  **(Optionnel) Lancer Storybook pour le système de design UI :**
    ```bash
    npm run dev --workspace=packages/ui
    ```
    Accédez à Storybook pour développer et tester les composants UI de manière isolée.

### Scripts utiles

- `npm install` : Installe toutes les dépendances du monorepo.
- `npm run build` : Compile tous les projets du monorepo pour la production.
- `npm run lint` : Exécute ESLint sur tous les projets.
- `npm run format` : Formate tout le code avec Prettier.
- `npm run type-check` : Vérifie les types TypeScript sur tous les projets.
- `npm run test` : Exécute les tests unitaires (Vitest) et API (Supertest) sur tous les projets.
- `npm run test:coverage` : Exécute les tests avec couverture de code.
- `npm run db:generate --workspace=packages/db` : Génère les migrations Drizzle à partir du schéma DB.
- `npm run db:migrate --workspace=packages/db` : Applique les migrations à la base de données SQLite.
- `npm run db:seed --workspace=packages/db` : Popule la base de données avec des données de test/démo.
- `npx playwright test --workspace=apps/desktop` : Exécute les tests E2E Playwright pour l'application Electron.

## 🧱 Structure du Projet

- `apps/` : Contient les applications exécutables.
  - `desktop/` : Le processus principal Electron, les scripts preload, et la configuration Electron-vite. Inclut la logique de traitement vidéo (FFmpeg) et l'interaction IPC.
  - `server/` : L'API Express/HTTP locale qui gère la persistance des données (SQLite/Drizzle), la logique métier, la planification des publications (`node-cron`), et l'intégration avec les providers sociaux (ex: Ayrshare).
  - `web/` : Le renderer de l'interface utilisateur construite avec React, Vite, et Tailwind CSS. C'est l'interface principale avec laquelle l'utilisateur interagit.
- `packages/` : Contient les bibliothèques et configurations réutilisables.
  - `config/` : Configurations partagées pour ESLint, Prettier et TypeScript.
  - `db/` : Drizzle ORM, schéma de base de données SQLite, scripts de migration et de seed.
  - `sdk/` : Contrats TypeScript (IPC), définitions des réseaux sociaux et leurs contraintes, interfaces pour les providers sociaux, et la classe `AppError` pour la gestion centralisée des erreurs.
  - `ui/` : Système de design React réutilisable (composants UI, Storybook).
- `.github/workflows/` : Workflows GitHub Actions pour la CI (build, lint, test) et le CD (packaging multi-OS, release-please).
- `tests/` : Fichiers de configuration et utilitaires de test globaux.

## ✨ Fonctionnalités clés (MVP)

- **Publication vidéo multi-réseaux :** Sélectionnez des plateformes (Instagram, Facebook, TikTok, YouTube, X), uploadez une vidéo, ajoutez une légende, et publiez simultanément.
- **Pré-vérifications vidéo :** L'application vérifie les contraintes de durée, ratio, et taille pour chaque réseau, suggérant un re-encodage si nécessaire (effectué localement via FFmpeg).
- **Planification :** Programmez vos publications pour une date et une heure spécifiques, avec gestion des fuseaux horaires.
- **Suivi du statut :** Visualisez le statut de publication pour chaque réseau (en attente, en cours, publié, échoué), avec des liens directs vers les posts et des options de retry.
- **Onboarding guidé :** Un tutoriel interactif pour les nouveaux utilisateurs, avec option de le passer.
- **Thème clair/sombre :** Interface utilisateur adaptable aux préférences de thème.
- **Internationalisation (FR/EN) :** Support multilingue.
- **Sécurité Electron renforcée :** `contextIsolation: true`, `nodeIntegration: false`, `sandbox`, CSP stricte, stockage des secrets via `keytar`.
- **Gestion d'erreurs structurée :** Des codes d'erreurs unifiés, des messages utilisateur clairs et des actions de résolution suggérées.

## 🛣️ Feuille de route (Future)

- **Analyse de performance détaillée :** Dashboards plus riches avec plus de KPIs, filtres avancés, et comparatifs.
- **Gestion des comptes :** Ajout, modification, et suppression des comptes sociaux connectés, gestion des tokens (actualisation automatique).
- **Providers sociaux natifs :** Intégration directe des APIs de réseaux sociaux (au-delà d'Ayrshare) pour un contrôle plus granulaire.
- **Notifications :** Notifications in-app pour le statut des publications, erreurs, etc.
- **Modèles de publication :** Sauvegarder des légendes ou des ensembles de réseaux fréquents.
- **Support d'images et carrousels :** Étendre la fonctionnalité de publication aux images.
- **Auto-update d'Electron :** Mise à jour transparente de l'application.

## 🤝 Contribution

Voir [CONTRIBUTING.md](#-contributingmd) pour plus d'informations sur la contribution au projet.
