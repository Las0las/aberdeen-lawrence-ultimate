/**
 * Command360 — Ranking Engine
 *
 * The single ranking engine for the entire system. No other module may assign
 * rank or sort work by priority. Surfaces must consume the pre-ranked list
 * produced here and must not reorder it.
 *
 * Composite score = URGENCY_WEIGHT × urgencyScore + ECONOMIC_WEIGHT × economicScore
 * Items are sorted descending by composite score; ordinal ranks start at 1.
 */

const URGENCY_WEIGHT = 0.6;
const ECONOMIC_WEIGHT = 0.4;

/** Minimum input shape required by the ranking engine. */
export interface Rankable {
  urgencyScore: number;
  economicScore: number;
}

/**
 * Compute the composite priority score for a single item.
 * Result is in [0, 1].
 */
export function compositeScore(item: Rankable): number {
  return URGENCY_WEIGHT * item.urgencyScore + ECONOMIC_WEIGHT * item.economicScore;
}

/**
 * Rank an array of items in-place by descending composite score.
 * Returns the same array (mutated) with an additional `rank` property
 * set on each element (1 = highest priority).
 *
 * Items with equal composite scores receive sequential ranks in their
 * original relative order (stable sort).
 */
export function rank<T extends Rankable>(items: T[]): (T & { rank: number })[] {
  const scored = items
    .map((item, originalIndex) => ({ item, score: compositeScore(item), originalIndex }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : a.originalIndex - b.originalIndex
    );

  return scored.map((entry, idx) => ({ ...entry.item, rank: idx + 1 }));
}
