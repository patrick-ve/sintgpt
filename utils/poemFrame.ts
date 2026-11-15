// "Aanhef en ondertekening": a "Lieve Patrick," line above the poem and
// "Van Sint & Piet" below it, as in a real sinterklaasgedicht. The server adds
// them, not the model, so they are always the same, never count towards the
// line count and arrive with the first line of the poem. They are part of the
// text the server signs, so the shared page, PDF, copy and history all have
// them without extra work.

export type PoemFrameLanguage = 'dutch' | 'english';

export interface PoemFrame {
  /** "Lieve Patrick,", or null when the name is not a plain name. */
  greeting: string | null;
  signature: string;
}

const SIGNATURES: Record<PoemFrameLanguage, string> = {
  dutch: 'Van Sint & Piet',
  english: 'From Sinterklaas & Pete',
};

const SALUTATIONS: Record<PoemFrameLanguage, string> = {
  dutch: 'Lieve',
  english: 'Dear',
};

/** "Lieve" or "Dear": the start of the greeting, for the form's preview. */
export function salutation(language: PoemFrameLanguage): string {
  return SALUTATIONS[language];
}

/** The longest name that still reads as a salutation. */
const GREETING_NAME_MAX = 40;

/**
 * The name as typed, if it reads as a name ("Patrick", "Oma & Opa",
 * "Jan-Willem", "Mr. Smith"). Anything else gets no greeting, because the
 * greeting puts the name verbatim in signed text on sintgpt.com and in the
 * share image: no links, digits or other text that is not a name.
 */
export function greetingName(name: string): string | null {
  const clean = name.replace(/\s+/g, ' ').trim();
  if (!clean || clean.length > GREETING_NAME_MAX) return null;
  if (!/^[\p{L}\p{M}][\p{L}\p{M}' ’.&-]*$/u.test(clean)) return null;
  // A dot followed by letters is a domain (evil.com), not an initial (J. de Vries).
  if (/\.[\p{L}]/u.test(clean)) return null;
  return clean;
}

export function poemFrame(name: string, language: PoemFrameLanguage): PoemFrame {
  const recipient = greetingName(name);
  return {
    greeting: recipient ? `${SALUTATIONS[language]} ${recipient},` : null,
    signature: SIGNATURES[language],
  };
}

/** The poem with the greeting above it and the signature below it. */
export function framePoem(poem: string, frame: PoemFrame): string {
  return [frame.greeting, poem.trim(), frame.signature].filter(Boolean).join('\n\n');
}

/**
 * The poem without the lines `framePoem` added, for a rewrite: the model must
 * not see them as part of the poem, or it writes them again.
 */
export function unframePoem(poem: string, frame: PoemFrame): string {
  const lines = poem.trim().split('\n');
  if (frame.greeting && lines[0]?.trim() === frame.greeting) lines.shift();
  if (lines.at(-1)?.trim() === frame.signature) lines.pop();
  return lines.join('\n').trim();
}

/** True for the signature line, which the page sets apart from the verses. */
export function isSignatureLine(line: string): boolean {
  const clean = line.trim();
  return Object.values(SIGNATURES).includes(clean);
}

interface StreamPart {
  type: string;
  id?: string;
  text?: string;
}

/**
 * Adds the frame to a text stream (AI SDK `TextStreamPart`s), so the page
 * receives exactly `framePoem(modelText, frame)`: the greeting arrives with
 * the first text of the poem (until then the page shows the writing
 * animation), whitespace at the start and end of the model's text is dropped,
 * and the signature comes when the step ends. Without text (an error or an
 * abort) nothing is added.
 */
export function framePoemStream<PART extends StreamPart>(frame: PoemFrame): TransformStream<PART, PART> {
  let textId: string | null = null;
  // Whitespace at the end of the text so far: sent only when more text follows.
  let pendingSpace = '';
  // text-end parts wait until the signature is in.
  const heldEnds: PART[] = [];
  let signed = false;

  const delta = (id: string, text: string) => ({ type: 'text-delta', id, text }) as PART;

  return new TransformStream<PART, PART>({
    transform(part, controller) {
      if (part.type === 'text-delta' && typeof part.text === 'string') {
        let text = part.text;
        if (textId === null) {
          text = text.trimStart();
          if (!text) return;
          textId = part.id ?? 'text';
          if (frame.greeting) text = `${frame.greeting}\n\n${text}`;
        } else {
          text = pendingSpace + text;
        }
        const body = text.trimEnd();
        pendingSpace = text.slice(body.length);
        if (body) controller.enqueue({ ...part, id: textId, text: body });
        return;
      }
      if (part.type === 'text-end') {
        heldEnds.push(part);
        return;
      }
      if (part.type === 'finish-step' || part.type === 'finish') {
        if (textId !== null && !signed) {
          controller.enqueue(delta(textId, `\n\n${frame.signature}`));
          signed = true;
        }
        for (const end of heldEnds.splice(0)) controller.enqueue(end);
      }
      controller.enqueue(part);
    },
    flush(controller) {
      for (const end of heldEnds.splice(0)) controller.enqueue(end);
    },
  });
}
