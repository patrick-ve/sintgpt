import { describe, expect, it } from 'vitest';
import { COUNTED_EVENTS, fetchPoemCount, poemCountQuery, seasonStart } from '../../server/utils/poemCounter';

const NOW = new Date('2026-11-28T13:00:00Z');

describe('poem counter', () => {
  it('counts new poems, rewrites and previews', () => {
    expect([...COUNTED_EVENTS]).toEqual(['Generate poem', 'Regenerate poem', 'Poem preview']);
  });

  it('starts the season on 1 September of the next pakjesavond, also after it', () => {
    expect(seasonStart(NOW).toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(seasonStart(new Date('2026-12-06T10:00:00Z')).toISOString()).toBe('2027-09-01T00:00:00.000Z');
  });

  it('asks for the season and the Dutch day in one weighted query', () => {
    const sql = poemCountQuery(NOW);
    expect(sql).toContain("timestamp >= toDateTime('2026-09-01 00:00:00')");
    // 28 November, 00:00 in the Netherlands is 23:00 UTC the day before.
    expect(sql).toContain("IF(timestamp >= toDateTime('2026-11-27 23:00:00'), _sample_interval, 0)");
    expect(sql).toContain("blob1 IN ('Generate poem', 'Regenerate poem', 'Poem preview')");
    expect(sql).toContain('SUM(_sample_interval) AS season');
  });

  it('reads the numbers, also when the API sends them as text', async () => {
    const fetcher = (async () => new Response(JSON.stringify({ data: [{ season: '236', today: 21.4 }] }))) as unknown as typeof fetch;
    expect(await fetchPoemCount('token', NOW, fetcher)).toEqual({ season: 236, today: 21 });
    const empty = (async () => new Response(JSON.stringify({ data: [] }))) as unknown as typeof fetch;
    expect(await fetchPoemCount('token', NOW, empty)).toEqual({ season: 0, today: 0 });
    const failing = (async () => new Response('no', { status: 403 })) as unknown as typeof fetch;
    await expect(fetchPoemCount('token', NOW, failing)).rejects.toThrow('403');
  });
});
