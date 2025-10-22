
export type Network = 'instagram'|'facebook'|'tiktok'|'youtube'
export interface KPI {
  followers: number
  impressions: number
  views: number
  likes: number
  comments: number
  shares?: number
  engagementRate?: number
  period: { from: string; to: string }
}
