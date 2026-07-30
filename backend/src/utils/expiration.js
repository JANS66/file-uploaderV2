export function calculateExpiration(expiresIn) {
  const now = new Date();
  switch (expiresIn) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "never":
      return null;
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
