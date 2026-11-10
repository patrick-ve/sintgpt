import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { OG_IMAGES } from '../../scripts/og-images';
import { BLOG_POSTS, formatDutchDate, relatedBlogPosts } from '../../utils/blogPosts';

const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const pageSlugs = readdirSync(new URL('pages/blog/', root))
  .filter(file => file.endsWith('.vue') && file !== 'index.vue')
  .map(file => file.replace(/\.vue$/, ''));

describe('blog posts', () => {
  it('lists every post page once, and every listed post has a page', () => {
    const listed = BLOG_POSTS.map(post => post.slug);
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual([...pageSlugs].sort());
  });

  it.each(pageSlugs)('%s uses BlogPost with its own slug and share image', (slug) => {
    const page = read(`pages/blog/${slug}.vue`);
    expect(page).toContain(`<BlogPost\n    slug="${slug}"`);
    expect(page).toContain(`og-image="blog-${slug}"`);
    expect(OG_IMAGES.some(image => image.name === `blog-${slug}`)).toBe(true);
    expect(page).toContain(`data-cta="blog:${slug}"`);
  });

  it('is in the sitemap and llms.txt', () => {
    const sitemap = read('public/sitemap.xml');
    const llms = read('public/llms.txt');
    for (const post of BLOG_POSTS) {
      expect(sitemap).toContain(`<loc>https://sintgpt.com/blog/${post.slug}</loc>`);
      expect(llms).toContain(`https://sintgpt.com/blog/${post.slug}`);
    }
  });

  it('is newest first, with valid dates', () => {
    const dates = BLOG_POSTS.map(post => post.published);
    expect(dates).toEqual([...dates].sort().reverse());
    for (const post of BLOG_POSTS) {
      expect(post.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (post.modified) expect(post.modified >= post.published).toBe(true);
    }
  });

  it('links each post to other existing posts, and every post gets at least 2 such links', () => {
    const inbound = new Map(BLOG_POSTS.map(post => [post.slug, 0]));
    for (const post of BLOG_POSTS) {
      const related = relatedBlogPosts(post.slug);
      expect(related.map(item => item.slug)).toEqual(post.related);
      expect(post.related).not.toContain(post.slug);
      for (const slug of post.related) inbound.set(slug, inbound.get(slug)! + 1);
    }
    for (const [slug, count] of inbound) expect(count, slug).toBeGreaterThanOrEqual(2);
  });

  it('formats Dutch dates without a time zone', () => {
    expect(formatDutchDate('2025-11-17')).toBe('17 november 2025');
    expect(formatDutchDate('2026-01-01')).toBe('1 januari 2026');
  });
});
