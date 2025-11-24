import { z } from "zod";

/**
 * Liste des réseaux supportés par Influence.
 * ⚠️ Source de vérité centrale pour toute l'application.
 *
 * Ajoute ici un réseau si un jour tu veux en supporter un nouveau :
 * ex: ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin']
 */
export const NetworkIdSchema = z.enum([
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
]);

/**
 * Type TS dérivé automatiquement de la liste ci-dessus.
 *
 * Exemple :
 *  - "instagram"
 *  - "youtube"
 */
export type NetworkId = z.infer<typeof NetworkIdSchema>;
