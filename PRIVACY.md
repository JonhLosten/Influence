# 🔒 Politique de Confidentialité pour InfluenceOps

Chez InfluenceOps, nous nous engageons à protéger votre vie privée. Cette politique de confidentialité explique quelles informations sont collectées, comment elles sont utilisées et vos choix concernant ces informations.

## 1. Informations Collectées

### Données Locales

L'application InfluenceOps est conçue pour fonctionner en **offline-first** et stocke la plupart de ses données localement sur votre appareil (via SQLite). Ces données peuvent inclure :

- **Informations sur les publications :** Légendes, chemins des fichiers vidéo originaux et traités, réseaux sociaux ciblés, dates de programmation et de publication.
- **Statut des tâches :** Statut de publication pour chaque réseau, messages d'erreur, URL des posts publiés.
- **Préférences utilisateur :** Thème clair/sombre, statut d'onboarding terminé, préférences linguistiques.
- **Informations de profil social (sans jetons) :** Noms d'utilisateur, identifiants de profil, URL d'avatar des comptes connectés (ces données sont synchronisées localement depuis les APIs sociales, mais les jetons d'authentification sensibles ne sont pas stockés dans la base de données locale).

### Données Sensibles (Jetons d'Authentification)

Les jetons d'authentification pour les services de médias sociaux ou les APIs tierces (comme Ayrshare) sont stockés de manière sécurisée en utilisant **Keytar** (le trousseau d'accès/gestionnaire de mots de passe du système d'exploitation). Ces jetons ne sont jamais stockés en clair dans la base de données locale ou exposés au processus de rendu de l'application.

### Données de Tiers (Ayrshare)

Si vous utilisez la fonctionnalité de publication via Ayrshare (ou d'autres agrégateurs/APIs tierces à l'avenir) :

- Les vidéos, légendes et identifiants de profil nécessaires à la publication sont envoyés à Ayrshare (ou au service tiers).
- Veuillez consulter la politique de confidentialité d'Ayrshare (ou du service tiers concerné) pour comprendre comment ils collectent, utilisent et protègent vos données.

### Collecte d'Erreurs et Rapports de Crash (Opt-in)

- Nous utilisons **Sentry** pour collecter des rapports d'erreurs et de crash afin d'améliorer la stabilité et la qualité de l'application.
- **Cette fonctionnalité est entièrement OPTIONNELLE.** Elle est désactivée par défaut.
- Si vous choisissez d'activer les rapports de crash (via un paramètre dans `.env` pendant le développement ou une future préférence utilisateur), des informations techniques sur l'erreur (trace de pile, informations système non-identifiantes) peuvent être envoyées à Sentry. Aucune donnée personnelle identifiable n'est intentionnellement collectée via Sentry.

## 2. Utilisation des Informations

Nous utilisons les informations collectées pour :

- Fournir les fonctionnalités de base de l'application (publication, planification, suivi).
- Personnaliser votre expérience (thème, langue).
- Améliorer la performance et la stabilité de l'application (via les rapports d'erreurs opt-in).

## 3. Partage des Informations

- Nous ne vendons ni ne louons vos informations personnelles à des tiers.
- Les informations sont partagées avec des services tiers (comme Ayrshare ou Sentry, si opt-in) uniquement dans le but de fournir les fonctionnalités de l'application ou d'améliorer le service, comme décrit ci-dessus.

## 4. Vos Choix et Droits

- **Accès aux données locales :** Toutes vos données locales sont stockées sur votre appareil. Vous pouvez les consulter et les gérer directement via les fonctionnalités de l'application ou en accédant à la base de données SQLite (pour les utilisateurs avancés).
- **Suppression des données :** La désinstallation de l'application supprimera la plupart des données locales. Vous pouvez également supprimer des publications et des profils via l'interface de l'application.
- **Rapports de crash :** Vous avez le contrôle d'activer ou de désactiver la collecte des rapports d'erreurs et de crash via Sentry.

## 5. Modifications de cette Politique

Nous pouvons mettre à jour notre politique de confidentialité de temps à autre. Nous vous informerons de tout changement en mettant à jour cette page. Il est conseillé de consulter cette politique de confidentialité régulièrement pour tout changement.

## 6. Contactez-nous

Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à `support@influenceops.com` (adresse factice à remplacer par une vraie).
