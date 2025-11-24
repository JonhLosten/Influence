// apps/server/src/routes/accounts.ts

import { Router } from "express";
import type { SocialAccountSearchResult } from "@influence/sdk";
import { computeScore } from "../utils/fuzzy";
import { normalizeQuery } from "../utils/normalize";

export const accountRouter = Router();

/**
 * Stub de fonction de recherche côté provider.
 *
 * 💡 À terme, tu pourras :
 *  - appeler Ayrshare
 *  - ou les APIs natives (YouTube, Instagram, etc.)
 *  - filtrer en fonction de `network`
 *
 * Pour l’instant, on renvoie des données simulées pour construire l’UX.
 */
async function providerSearch(
  network: string,
  query: string
): Promise<SocialAccountSearchResult[]> {
  // TODO: remplacer par la vraie implémentation provider
  const mockData: SocialAccountSearchResult[] = [
    {
      id: "1",
      username: "raph.lcv",
      displayName: "Raphaël LC",
      avatar: "https://via.placeholder.com/80",
      followers: 120_000,
      network: network as any,
    },
    {
      id: "2",
      username: "raphlc",
      displayName: "Raph LC",
      avatar: "https://via.placeholder.com/80",
      followers: 25_000,
      network: network as any,
    },
    {
      id: "3",
      username: "raph_lcv_official",
      displayName: "Raphael Official",
      avatar: "https://via.placeholder.com/80",
      followers: 8_000,
      network: network as any,
    },
  ];

  return mockData;
}

/**
 * GET /api/accounts/search?network=instagram&q=raphlcv
 *
 * - `network` : ex "instagram", "youtube", "tiktok", "facebook"
 * - `q`       : texte saisi par l’utilisateur (ex "raphlcv")
 *
 * Retourne une liste triée par :
 *  1) score fuzzy (similarité)
 *  2) nombre d'abonnés
 */
accountRouter.get("/search", async (req, res) => {
  const { network, q } = req.query;

  if (!network || !q) {
    return res.status(400).json({ error: "network and q are required" });
  }

  const normalized = normalizeQuery(String(q));

  try {
    const rawResults = await providerSearch(String(network), normalized);

    const scored = rawResults
      .map((acc) => ({
        ...acc,
        score: computeScore(normalized, acc.username),
      }))
      .sort((a, b) => {
        if ((b.score ?? 0) !== (a.score ?? 0)) {
          return (b.score ?? 0) - (a.score ?? 0);
        }
        return (b.followers ?? 0) - (a.followers ?? 0);
      });

    return res.json(scored);
  }
  catch (err) {
    console.error("[accounts/search] error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

/**
 * POST /api/accounts/add
 *
 * Body JSON = SocialAccountSearchResult (ou ConfirmableAccount côté front).
 *
 * Pour l’instant :
 *  - on valide que les champs principaux sont là
 *  - on log
 *  - on renvoie { success: true }
 *
 * 💡 Étape suivante (quand tu voudras) :
 *  - intégrer Drizzle / SQLite pour persister réellement le compte
 *  - déclencher un rafraîchissement des comptes côté front
 */
accountRouter.post("/add", async (req, res) => {
  const account = req.body as Partial<SocialAccountSearchResult>;

  if (!account || !account.id || !account.username || !account.network) {
    return res.status(400).json({ error: "Invalid account payload" });
  }

  try {
    // TODO: remplacer par un insert via Drizzle dans packages/db
    console.log("[accounts/add] saving account:", account);

    return res.json({ success: true });
  }
  catch (err) {
    console.error("[accounts/add] error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});
