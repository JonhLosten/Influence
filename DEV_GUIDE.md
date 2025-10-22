
# Guide Développeur

## Architecture
- `server/` : API locale (Express). Normalise les métriques multi-réseaux.
- `src/` : React (Vite) + Tailwind. Vues : Dashboard, Network, Settings.
- `app/` : Processus principal Electron (packaging desktop).
- i18n : `src/locales/*.json` + `src/i18n.ts` (persistance via localStorage).

## Ajouter des métriques ou réseaux
- Définir leurs mappings dans `server/normalize.ts` et leurs appels dans `server/ayrshare.ts`.
- Ajouter la page dédiée dans `src/views/` si besoin.

## Endpoints
- `GET /api/snapshot?days=30` → agrège les KPI par réseau + top contenus.

## Personnaliser les seuils/couleurs
- `src/lib/scoring.ts`.

## Build
- `vite build` → renderer.
- `tsc -p tsconfig.app.json` → app Electron.
- `electron-forge make` → installeur (.exe).

## Conseils prod
- Protéger la clé Ayrshare côté serveur (ici local). Pour du multi-poste, héberger l'API sur un backend distant.
- Gérer l'auth utilisateur si déploiement partagé.
