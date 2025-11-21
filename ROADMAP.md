# 🗺️ Feuille de Route d'InfluenceOps

Cette feuille de route présente les orientations et les fonctionnalités envisagées pour l'avenir d'InfluenceOps. Les priorités peuvent évoluer en fonction des retours des utilisateurs et des besoins du marché.

## Phase 1 : MVP (Minimum Viable Product) - Actuellement implémenté / en cours

- **Publication vidéo multi-réseaux :** Interface utilisateur pour sélectionner les réseaux/profils, uploader une vidéo, ajouter une légende.
- **Pré-vérifications vidéo :** Validation des contraintes par réseau (durée, ratio, taille) et re-encodage/redimensionnement local si nécessaire (FFmpeg).
- **Planification et Suivi :** Possibilité de publier immédiatement ou de programmer, avec un suivi du statut par réseau (en attente, en cours, publié, échoué, retries avec backoff).
- **Onboarding guidé :** Tutoriel interactif pour les nouveaux utilisateurs avec option de passer.
- **Gestion d'erreurs exemplaire :** Codes d'erreurs structurés, messages utilisateur clairs et action de résolution.
- **Base technique robuste :** Electron durci, IPC sécurisé, Zod pour la validation, Keytar pour les secrets, Drizzle ORM avec SQLite (migrations).
- **CI/CD fiable :** GitHub Actions pour build, lint, test (unit/API/E2E), packaging multi-OS, et gestion des releases via `release-please`.
- **UX/UI moderne :** Thème clair/sombre, responsive, i18n (FR/EN).
- **Documentation de base :** README, ARCHITECTURE, CONTRIBUTING, SECURITY, PRIVACY.

## Phase 2 : Améliorations de l'Expérience Utilisateur & Robustesse

- **Dashboards d'analyse de performance :**
  - Ajout de KPIs détaillés (impressions, engagement, CTR, portée) par post et par réseau.
  - Filtres avancés (par date, réseau, statut de publication).
  - Comparatifs de performance entre réseaux ou périodes.
- **Gestion avancée des comptes :**
  - Interface dédiée pour connecter/déconnecter les comptes sociaux.
  - Mécanisme d'actualisation automatique des jetons d'accès OAuth.
  - Indicateurs visuels de l'état de connexion des comptes.
- **Notifications in-app :** Alertes pour le succès/échec des publications, les erreurs critiques, les rappels de programmation.
- **Optimisation du traitement vidéo :** Amélioration des algorithmes de re-encodage pour la qualité et la vitesse, gestion des files d'attente de traitement.
- **Améliorations A11y :** Audit WCAG complet et corrections pour assurer une conformité AA.
- **Tests de robustesse :** Tests dédiés aux pannes réseau, quotas API dépassés, annulations de tâches, reprise après crash, gestion des fichiers médias extrêmes.

## Phase 3 : Fonctionnalités Avancées & Élargissement

- **Support d'autres types de médias :** Publication d'images uniques, carrousels/galeries multi-images.
- **Modèles de publication :** Sauvegarde et réutilisation de légendes, hashtags, ensembles de réseaux/profils.
- **Intégration d'APIs natives :** Développer des providers natifs pour les réseaux sociaux majeurs (Instagram Graph API, YouTube Data API, etc.) pour un contrôle plus fin que les agrégateurs.
- **Collaboration d'équipe :** Fonctionnalités multi-utilisateurs, rôles et permissions.
- **Intégrations tierces :** Connexion avec des outils d'analyse, de gestion de contenu ou de CRM.
- **Planification avancée :** Calendrier visuel des publications, options de répétition.
- **Export de données :** Exporter les données d'analyse et de publication.

## Phase 4 : Améliorations de la Qualité de Vie & Maintenance

- **Auto-update d'Electron :** Mise à jour transparente de l'application pour les utilisateurs.
- **Nettoyage automatique :** Gestion des fichiers temporaires (vidéos re-encodées, logs anciens).
- **Page de Dépannage intégrée :** Affichage dynamique des codes d'erreurs et des solutions connues.
- **Refactorisation et optimisation continues.**

**Note :** Cette feuille de route est un document évolutif. De nouvelles idées peuvent être ajoutées, des priorités ajustées, et des éléments peuvent être déplacés entre les phases.
