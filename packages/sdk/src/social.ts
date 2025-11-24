// Nouveau type retourné par la recherche de comptes
export interface SocialAccountSearchResult {
  id: string;                // id interne du provider
  username: string;          // identifiant exact
  displayName: string;       // nom public
  avatar: string | null;     // url avatar
  followers: number | null;  // popularité
  network: Network;          // youtube | instagram | tiktok
  score?: number;            // score fuzzy, ajouté côté serveur
}

// Type utilisé pour la confirmation dans la popup
export interface ConfirmableAccount extends SocialAccountSearchResult {
  suggestionRank: number;    // 1er, 2e, 3e meilleur match
}
