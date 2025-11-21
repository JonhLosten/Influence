# 🤝 Guide de Contribution pour InfluenceOps

Nous apprécions grandement votre intérêt à contribuer à InfluenceOps ! Pour assurer une collaboration fluide et maintenir la qualité du projet, veuillez suivre ces directives.

## Table des Matières

1.  [Code de Conduite](#1--code-de-conduite)
2.  [Comment Contribuer](#2--comment-contribuer)
    - [Signaler un Bug](#signaler-un-bug)
    - [Suggérer une Fonctionnalité](#suggérer-une-fonctionnalité)
    - [Contribuer du Code](#contribuer-du-code)
3.  [Configuration de l'Environnement de Développement](#3--configuration-de-lenvironnement-de-développement)
4.  [Conventions de Code et de Commit](#4--conventions-de-code-et-de-commit)
5.  [Processus de Pull Request (PR)](#5--processus-de-pull-request-pr)

## 1. 📜 Code de Conduite

Nous nous engageons à fournir un environnement accueillant et inclusif pour tout le monde. Veuillez consulter notre [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) (à créer) pour plus de détails sur le comportement attendu.

## 2. 🚀 Comment Contribuer

### Signaler un Bug

Si vous trouvez un bug, veuillez ouvrir une [issue sur GitHub](https://github.com/JonhLosten/Influence/issues) et inclure autant de détails que possible :

- Une description claire et concise du bug.
- Les étapes pour reproduire le comportement.
- Le comportement attendu.
- Le comportement actuel.
- Des captures d'écran ou des logs si pertinents.
- Votre environnement (OS, version de l'application).

### Suggérer une Fonctionnalité

Nous sommes ouverts aux nouvelles idées ! Veuillez ouvrir une [issue sur GitHub](https://github.com/JonhLosten/Influence/issues) avec le tag `feature` et fournir :

- Une description claire de la fonctionnalité proposée.
- Le problème qu'elle résout ou le cas d'utilisation.
- Des exemples ou des maquettes si possible.

### Contribuer du Code

1.  **Forker le dépôt :** Commencez par forker le dépôt `JonhLosten/Influence` sur votre compte GitHub.
2.  **Cloner votre fork :** `git clone https://github.com/votre-utilisateur/Influence.git`
3.  **Créer une branche :** Créez une nouvelle branche pour votre fonctionnalité ou votre correction de bug. Utilisez des noms descriptifs comme `feature/nouvelle-fonctionnalite` ou `fix/nom-du-bug`.
    `git checkout -b feature/ma-super-fonctionnalite`
4.  **Implémenter vos changements.**
5.  **Tester vos changements :** Assurez-vous que tous les tests existants passent et ajoutez de nouveaux tests si nécessaire pour couvrir vos modifications.
6.  **Respecter les conventions de code et de commit.**
7.  **Mettre à jour la documentation :** Si vos changements affectent la façon dont l'application est utilisée ou développée, mettez à jour le `README.md`, `ARCHITECTURE.md`, ou d'autres fichiers de documentation pertinents.
8.  **Créer une Pull Request (PR) :** Une fois vos changements prêts, poussez votre branche vers votre fork et ouvrez une Pull Request vers la branche `main` du dépôt original.

## 3. 🖥️ Configuration de l'Environnement de Développement

Suivez la section **Installation** du [README.md](./README.md) pour configurer votre environnement de développement.

## 4. 📝 Conventions de Code et de Commit

- **Formatage :** Nous utilisons Prettier pour le formatage du code. Le hook `pre-commit` de Husky exécutera `prettier --write` automatiquement.
- **Linting :** ESLint est configuré pour faire respecter les règles de qualité de code. Le hook `pre-commit` exécutera également `eslint --fix`.
- **Messages de Commit :** Nous utilisons la convention [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) pour les messages de commit. Le hook `commit-msg` de Husky utilisera `commitlint` pour valider vos messages.
  - Exemples : `feat: ajouter la publication vidéo`, `fix: corriger le crash au démarrage`, `docs: mettre à jour le README`.

## 5. 🚀 Processus de Pull Request (PR)

Avant de soumettre votre PR, veuillez vous assurer que :

- Elle cible la branche `main`.
- Tous les tests CI passent (`npm run test`).
- Le code est formaté (`npm run format`) et linté (`npm run lint`).
- La documentation pertinente est mise à jour.
- Vous avez rempli le modèle de PR avec une description claire de vos changements.

Une fois votre PR soumise, un relecteur l'examinera. Des modifications supplémentaires peuvent être demandées. Une fois approuvée, votre code sera fusionné dans la branche `main`.
