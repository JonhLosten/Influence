# 🔒 Politique de Sécurité pour InfluenceOps

Chez InfluenceOps, nous prenons la sécurité au sérieux. Nous nous engageons à protéger les données de nos utilisateurs et à maintenir la confiance.

## Signaler une Vulnérabilité

Si vous découvrez une vulnérabilité de sécurité dans InfluenceOps, nous vous encourageons à la signaler de manière responsable. Veuillez nous contacter directement par email à `security@influenceops.com` (adresse factice à remplacer par une vraie).

Dans votre rapport, veuillez inclure :

- Une description claire de la vulnérabilité.
- Les étapes pour la reproduire (si applicable).
- Le comportement attendu.
- Le comportement actuel.
- Des preuves (captures d'écran, vidéos, logs, etc.).
- L'impact potentiel de la vulnérabilité.

Nous nous efforcerons de répondre à votre rapport dans les plus brefs délais et de prendre les mesures nécessaires pour corriger la vulnérabilité.

## Nos Mesures de Sécurité

InfluenceOps met en œuvre plusieurs mesures de sécurité pour protéger l'application et les données de ses utilisateurs, notamment :

- **Durcissement d'Electron :** Utilisation de `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` et d'une Content Security Policy (CSP) stricte.
- **Communication Inter-Processus (IPC) Sécurisée :** L'API est minimale, typée et validée par Zod.
- **Stockage des Secrets :** Les informations sensibles (tokens d'API, clés) sont stockées de manière chiffrée au niveau du système d'exploitation via Keytar, jamais exposées au renderer.
- **Validation d'Entrée :** Toutes les entrées de l'API locale et des communications IPC sont validées par Zod pour prévenir les injections et autres attaques.
- **Dépendances à Jour :** Nous nous efforçons de maintenir nos dépendances à jour pour minimiser les vulnérabilités connues.
- **Tests de Sécurité :** L'intégration de tests E2E et de linting aide à identifier les failles potentielles.
- **Logging et Surveillance :** Des logs détaillés et la surveillance d'erreurs (via Sentry, opt-in) nous aident à détecter et réagir aux incidents.

## Mises à Jour et Correctifs

Nous nous engageons à publier des correctifs de sécurité en temps opportun. Les utilisateurs seront informés des mises à jour critiques via le mécanisme d'auto-update de l'application (quand implémenté) et le changelog.
