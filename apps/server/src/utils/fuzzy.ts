// apps/server/src/utils/fuzzy.ts

import { normalizeQuery } from "./normalize";

/**
 * Implémentation compacte de Jaro-Winkler pour un score de similarité entre 0 et 1.
 * Plus le score est proche de 1, plus les chaînes sont similaires.
 */
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;

  const s1 = a;
  const s2 = b;
  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0 || len2 === 0) {
    return 0;
  }

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // On compte les caractères "matchés"
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (!matches) {
    return 0;
  }

  // On compte les transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) {
      k++;
    }
    if (s1[i] !== s2[k]) {
      transpositions++;
    }
    k++;
  }

  const m = matches;
  const jaro =
    (m / len1 + m / len2 + (m - transpositions / 2) / m) / 3;

  // Préfixe commun (max 4 chars)
  let prefix = 0;
  const prefixLimit = 4;
  for (let i = 0; i < Math.min(prefixLimit, len1, len2); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  const scalingFactor = 0.1;

  return jaro + prefix * scalingFactor * (1 - jaro);
}

/**
 * Score fuzzy entre la requête utilisateur et le username.
 */
export function computeScore(input: string, username: string): number {
  return jaroWinkler(normalizeQuery(input), normalizeQuery(username));
}
