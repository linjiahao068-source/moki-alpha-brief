export function normalizeConsensusTicker(ticker: string) {
  return ticker.trim().toUpperCase();
}

export function isValidConsensusTicker(ticker: string) {
  return /^[A-Z0-9.-]{1,12}$/.test(normalizeConsensusTicker(ticker));
}
