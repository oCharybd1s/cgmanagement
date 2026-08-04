export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const MIN_MATCH_SCORE = 0.32;

function levenshteinDistance(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

  let previousRow = Array.from({ length: b.length + 1 }, (_, index) => index);
  let currentRow = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    currentRow[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1,
        previousRow[j] + 1,
        previousRow[j - 1] + substitutionCost,
      );
    }
    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[b.length];
}

function bestPrefixDistance(token: string, word: string): number {
  if (word.length === 0) {
    return token.length;
  }

  let best = levenshteinDistance(token, word);
  const minLength = Math.max(1, token.length - 2);
  const maxLength = Math.min(word.length, token.length + 2);

  for (let length = minLength; length <= maxLength; length += 1) {
    const distance = levenshteinDistance(token, word.slice(0, length));
    if (distance < best) {
      best = distance;
    }
  }

  return best;
}

function wordScore(token: string, word: string): number {
  if (word.length === 0 || token.length === 0) {
    return 0;
  }
  if (token === word) {
    return 1;
  }

  const coverage = Math.min(token.length, word.length) / word.length;

  if (word.includes(token)) {
    return coverage;
  }

  const distance = bestPrefixDistance(token, word);
  const maxLength = Math.max(token.length, word.length);
  const similarity = Math.max(0, 1 - distance / maxLength);

  return similarity * coverage;
}

function tokenScore(token: string, normalizedText: string): number {
  return normalizedText.split(" ").reduce((best, word) => Math.max(best, wordScore(token, word)), 0);
}

export function fuzzyScore(query: string, ...fields: (string | null | undefined)[]): number {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery === "") {
    return 1;
  }

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  const normalizedFields = fields.filter((field): field is string => Boolean(field)).map(normalizeSearchText);

  if (tokens.length === 0 || normalizedFields.length === 0) {
    return 0;
  }

  const combinedText = normalizedFields.join(" ");
  const tokenScores = tokens.map((token) => tokenScore(token, combinedText));

  if (tokenScores.some((score) => score <= 0)) {
    return 0;
  }

  return tokenScores.reduce((sum, score) => sum + score, 0) / tokenScores.length;
}

export function fuzzyMatch(query: string, ...fields: (string | null | undefined)[]): boolean {
  return fuzzyScore(query, ...fields) >= MIN_MATCH_SCORE;
}

export function rankBySearch<T>(
  query: string,
  items: T[],
  getFields: (item: T) => (string | null | undefined)[],
): T[] {
  if (normalizeSearchText(query) === "") {
    return items;
  }

  return items
    .map((item) => ({ item, score: fuzzyScore(query, ...getFields(item)) }))
    .filter((entry) => entry.score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
