import type { NetworkId } from "./networks";

/**
 * Résultat brut d'une recherche de compte sur un réseau social.
 */
export interface SocialAccountSearchResult {
  id: string;                // ID interne du provider (YouTube, Instagram, etc.)
  username: string;          // identifiant exact du compte (ex: "raph.lcv")
  displayName: string;       // nom public (ex: "Raphaël LC")
  avatar: string | null;     // URL de l'avatar
  followers: number | null;  // popularité
  network: NetworkId;        // "instagram" | "youtube" | ...
  score?: number;            // score fuzzy
}

/**
 * Compte proposé à l'utilisateur pour validation ("est-ce bien ce compte ?").
 */
export interface ConfirmableAccount extends SocialAccountSearchResult {
  suggestionRank: number;    // 1 = meilleur résultat, 2 = second, etc.
}
