export function normalizeQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents
    .replace(/@/g, "")               // retire le @
    .replace(/\s+/g, "")             // retire espaces
    .replace(/[^a-z0-9._]/g, "");    // ne garde que lettres, chiffres, . et _
}
