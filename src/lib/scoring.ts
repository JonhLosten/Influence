
export type Band = 'bad'|'avg'|'good'
export function band(value:number, targets:{bad:number; good:number}): Band {
  if (value <= targets.bad) return 'bad'
  if (value >= targets.good) return 'good'
  return 'avg'
}
export function bandColor(b:Band){
  return b==='bad'?'#ef4444':b==='avg'?'#f59e0b':'#22c55e'
}
