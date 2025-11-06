# InfluenceOps 🧠

Tableau de bord multi-réseaux (Instagram, Facebook, TikTok, YouTube).
- **Desktop** via Electron (processus principal + preload sécurisés)
- **UI** React + Vite + Tailwind (renderer sandboxé)
- **API locale** HTTP (Express-like) validée avec Zod
- **Monorepo TypeScript** propulsé par Turborepo & workspaces

## 🚀 Installation

1. Installer Node.js ≥ 20.
2. Cloner le dépôt puis exécuter `npm install` (les workspaces seront reliés automatiquement).
3. (Optionnel) Copier `.env.example` dans `apps/server/.env` et y ajouter votre clé Ayrshare (`AYRSHARE_API_KEY=...`).

> 💡 Sans clé Ayrshare, l'app fonctionne en **mode démo** (données factices).

## 🧱 Structure

- `apps/desktop` : processus Electron (main + preload), CSP stricte, IPC typé.
- `apps/web` : renderer React/Vite, alias `@/` vers `apps/web/src`.
- `apps/server` : API locale (Node HTTP) + pipeline analytique.
- `packages/sdk` : contrats TypeScript (IPC, providers sociaux, réseaux supportés).
- `packages/db` : configuration SQLite + Drizzle ORM (WAL activé, schémas principaux).
- `packages/ui` : design system partagé (premiers composants, ex. `<Button />`).
- `packages/config` : tsconfig strict, ESLint flat config, Prettier partagé.

## 📦 Scripts utiles

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance Vite (renderer) avec rechargement à chaud. |
| `npm run dev:server` | Watch mode pour l'API locale (`apps/server`). |
| `npm run dev:desktop` | Compile le processus Electron et lance l'app (nécessite un build du renderer). |
| `npm run build` | Exécute `vite build` + `tsc` sur l'ensemble du monorepo via Turborepo. |
| `npm run typecheck` | Vérifie le typage strict de tous les workspaces. |
| `npm run lint` | Lint TypeScript/JS (ESLint config partagée). |
| `npm run format` | Vérifie le formatage (Prettier). |
| `npm run test` | Suite de tests Node (Vitest-like via `node:test`). |
| `npm run make` | Build desktop (Electron Forge) après compilation. |

## 🌐 Langues & Préférences

- Langues disponibles : **Français** (par défaut) et **Anglais** via Paramètres.
- Les préférences (langue, thème…) sont persistées localement (`localStorage`).

## 🔐 Sécurité & Données

- IPC Electron validé par Zod (channels whitelists dans `packages/sdk`).
- Secrets et tokens destinés à être stockés via `keytar` (intégration à venir).
- Base locale SQLite (Drizzle + better-sqlite3) avec WAL pour de meilleures performances.

## 🛣️ Roadmap rapide

1. Implémenter les providers réels (`packages/sdk/providers/*`).
2. Finaliser la persistance (migrations Drizzle, seed, keytar pour secrets).
3. Ajouter tests E2E Playwright + pipeline CI multi-OS.
4. Étendre le design system (`packages/ui`) et intégrer Storybook.

Pour plus de détails, consulter [ARCHITECTURE.md](./ARCHITECTURE.md).
