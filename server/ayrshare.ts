
const AYR_BASE = "https://app.ayrshare.com/api";
const API_KEY = process.env.AYRSHARE_API_KEY;

async function ayr(path: string, init: RequestInit = {}) {
  if (!API_KEY) {
    // Mode démo : renvoie des données factices
    return demo(path);
  }
  const res = await fetch(`${AYR_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      ...(init.headers||{})
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

export async function getProfileAnalytics(network: string, days = 30){
  // NOTE: Adapter l'endpoint selon ton offre Ayrshare / réseaux activés.
  return ayr(`/analytics/social?network=${network}&days=${days}`);
}

export async function getPostsAnalytics(network: string, days = 30){
  return ayr(`/analytics/posts?network=${network}&days=${days}`);
}

// Données démo (si pas de clé API)
function demo(path: string){
  const now = new Date();
  const byNet = {
    instagram: { followers: 3200, impressions: 56000, views: 42000, likes: 4100, comments: 380, shares: 120, period:{from:'2025-09-21',to:'2025-10-21'} },
    facebook:  { followers: 5100, impressions: 72000, views: 53000, likes: 3500, comments: 420, shares: 210, period:{from:'2025-09-21',to:'2025-10-21'} },
    tiktok:    { followers: 12400, impressions: 98000, views: 97000, likes: 8800, comments: 650, shares: 460, period:{from:'2025-09-21',to:'2025-10-21'} },
    youtube:   { followers: 2100, impressions: 28000, views: 26000, likes: 1900, comments: 140, shares: 60,  period:{from:'2025-09-21',to:'2025-10-21'} },
  }
  const posts = []
  const networks = Object.keys(byNet)
  for (let i=0;i<25;i++){
    const n = networks[i%networks.length]
    const impressions = 1000 + Math.floor(Math.random()*9000)
    const likes = Math.floor(impressions * (0.03 + Math.random()*0.07))
    const comments = Math.floor(likes * (0.08 + Math.random()*0.12))
    const shares = Math.floor(likes * (0.05 + Math.random()*0.08))
    posts.push({
      id: n+"-"+i,
      network: n,
      title: n.toUpperCase()+" Post "+(i+1),
      url: "#",
      publishedAt: new Date(+now - i*86400000).toISOString(),
      views: impressions,
      impressions,
      likes, comments, shares,
      engagementRate: impressions ? (likes+comments+shares)/impressions : 0
    })
  }
  if (path.startsWith("/analytics/social")) {
    const n = new URLSearchParams(path.split("?")[1]).get("network") as keyof typeof byNet
    return byNet[n]
  }
  if (path.startsWith("/analytics/posts")) {
    const n = new URLSearchParams(path.split("?")[1]).get("network")
    return posts.filter(p=>p.network===n)
  }
  return {}
}
