# Architecture Monorepo Influence

Ce dépôt adopte une structure en **monorepo** articulée autour de workspaces npm. Les applications finales (desktop Electron, serveur local, renderer web) vivent dans `apps/`, tandis que les briques réutilisables (SDK IPC, base de données, design system, configuration partagée) vivent dans `packages/`.

```text
apps/
  desktop/   # Processus principal + preload Electron durci
  server/    # API Express/HTTP validée avec Zod
  web/       # Renderer React/Vite strictement sandboxé
packages/
  config/    # ESLint, Prettier et tsconfig stricts partagés
  db/        # Drizzle ORM + initialisation SQLite (WAL activé)
  sdk/       # Contrats TypeScript pour IPC, providers et réseaux
  ui/        # Design system React réutilisable (premiers composants)
```

## Principes clés

- **TypeScript strict partout** via un `tsconfig` partagé et des alias de chemins (`@/...`).
- **IPC Electron typé & validé** : le preload expose uniquement une surface sécurisée, les messages sont validés par Zod côté main & renderer.
- **Sécurité par défaut** : `contextIsolation`, `sandbox`, `CSP` verrouillée, whitelist des origines externes, `shell.openExternal` contrôlé.
- **Données locales** : `packages/db` configure SQLite + Drizzle avec WAL, tables de base pour utilisateurs, comptes, posts, jobs, métriques.
- **Validation systématique** des entrées (API + IPC) avec Zod et schémas partagés dans le SDK.
- **DX** : Turborepo orchestre `build`, `typecheck`, `dev`. Husky + lint-staged garantissent qualité avant commit.

## Commandes utiles

- `npm run dev` : lance le renderer Vite en mode développement.
- `npm run dev:server` : hot reload de l'API locale (tsx watch).
- `npm run dev:desktop` : build du process Electron (nécessite `npm run build` préalable pour générer `dist`).
- `npm run build` : exécute `tsc`/`vite build` pour chaque workspace (via Turbo).
- `npm run typecheck` : vérifie le typage de tous les projets.
- `npm run lint` / `npm run format` : lint + format via la config partagée.
- `npm run test` : exécute la suite de tests Node.

## Étapes suivantes suggérées

1. Implémenter les providers sociaux dans `packages/sdk` + `apps/server`.
2. Alimenter `packages/ui` avec les composants du renderer et intégrer Storybook.
3. Ajouter Drizzle Kit (`drizzle-kit generate`) pour produire les migrations depuis `packages/db`.
4. Déployer la CI (GitHub Actions) pour automatiser lint/typecheck/test/build.
