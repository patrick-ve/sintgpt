import { describe, expect, it } from 'vitest';
import { poemHtml } from '../../utils/poemHtml';

describe('poemHtml', () => {
  it('keeps the title, the line breaks and the stanzas', () => {
    const html = poemHtml(
      'Gedicht voor Oma Truus',
      'De Sint zag oma Truus met een taart op het plein,\nzij at hem alleen op, want hij was nogal klein.\n\nToen kwam Piet aan met een slagroomspuit,\nen spoot heel de taart in één keer leeg en uit.',
    );
    expect(html).toBe(
      '<meta charset="utf-8"><div><h2>Gedicht voor Oma Truus</h2>'
      + '<p>De Sint zag oma Truus met een taart op het plein,<br>zij at hem alleen op, want hij was nogal klein.</p>'
      + '<p>Toen kwam Piet aan met een slagroomspuit,<br>en spoot heel de taart in één keer leeg en uit.</p></div>',
    );
  });

  it('escapes HTML in the poem and the title', () => {
    const html = poemHtml('<b>Truus</b> & co', 'Een <script>alert(1)</script> in de zak,\n"Piet" zei \'nee\' op het dak.');
    expect(html).toContain('<h2>&lt;b&gt;Truus&lt;/b&gt; &amp; co</h2>');
    expect(html).toContain('Een &lt;script&gt;alert(1)&lt;/script&gt; in de zak,<br>&quot;Piet&quot; zei &#39;nee&#39; op het dak.');
    expect(html).not.toContain('<script>');
  });

  it('treats blank lines with spaces as a stanza break and leaves out an empty title', () => {
    expect(poemHtml('', 'Regel een,\nregel twee.\n  \nRegel drie,\nregel vier.\n'))
      .toBe('<meta charset="utf-8"><div><p>Regel een,<br>regel twee.</p><p>Regel drie,<br>regel vier.</p></div>');
  });
});
