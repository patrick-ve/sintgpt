// The poem as HTML for the clipboard, so Word, Google Docs and mail keep the
// title, the line breaks and the blank lines between stanzas. Plain text goes
// on the clipboard too; chat apps use that one.

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function poemHtml(title: string, poem: string): string {
  const stanzas = poem
    .trim()
    .split(/\n\s*\n/)
    .map(stanza => stanza.split('\n').map(line => escapeHtml(line.trim())).join('<br>'))
    .filter(Boolean)
    .map(stanza => `<p>${stanza}</p>`)
    .join('');
  const heading = title.trim() ? `<h2>${escapeHtml(title.trim())}</h2>` : '';
  return `<meta charset="utf-8"><div>${heading}${stanzas}</div>`;
}
