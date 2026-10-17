import { ContextInput, EditorContext, LanguageAdapter } from '../core/types';

const blank = (text: string) => text.replace(/[^\r\n]/g, ' ');
const maskProseAttributes = (tag: string) => tag.replace(/(\s(?:data-[\w:-]+|title|alt|placeholder|value)\s*=\s*)("[^"]*(?:"|$)|'[^']*(?:'|$)|[^\s>]+)/gi,
  (_, prefix, value) => prefix + blank(value));

/** Preserve offsets and tag attributes, but never treat prose or scripts as HTML cues. */
export function maskHtml(text: string): string {
  return text.replace(/<!--[\s\S]*?(?:-->|$)|<(script|style)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)|<[^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*(?:>|$)|[^<]+/gi,
    token => token.startsWith('<!--') ? blank(token)
      : /^<(script|style)\b/i.test(token) ? token.replace(/^(<[^>]*>)([\s\S]*)$/, (_, tag, body) => tag + blank(body))
      : token.startsWith('<') ? maskProseAttributes(token) : blank(token));
}

export function maskCss(text: string): string {
  const masked = text.replace(/@import\s+["'](?:tailwindcss|[^"'\r\n]*bootstrap[^"'\r\n]*)["']|\/\*[\s\S]*?(?:\*\/|$)|"(?:\\[\s\S]|[^"\\])*(?:"|$)|'(?:\\[\s\S]|[^'\\])*(?:'|$)/g, token => token.startsWith('@import') ? token : blank(token));
  // Class/id names describe application data, not CSS property concepts.
  // Keep a selector cue and stable offsets while masking their semantic words.
  return masked.replace(/(^|[{}])([^{}]+)(?=\{|$)/g, (_, boundary: string, prelude: string) =>
    boundary + prelude.replace(/[.#][a-zA-Z_][\w-]*/g, name => name[0] + 'x' + ' '.repeat(name.length - 2)));
}

function extract(input: ContextInput, languageId: 'html' | 'css'): EditorContext {
  const masked = languageId === 'html' ? maskHtml(input.text) : maskCss(input.text);
  const offset = Math.max(0, Math.min(input.offset, masked.length));
  const start = masked.lastIndexOf('\n', offset - 1) + 1;
  const end = masked.indexOf('\n', offset);
  const currentLine = masked.slice(start, end < 0 ? undefined : end).slice(0, 600);
  let focus = currentLine;
  if (languageId === 'html') {
    for (const tag of masked.matchAll(/<[^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*(?:>|$)/g)) {
      if (tag.index <= offset && tag.index + tag[0].length >= offset) {
        focus = tag[0].slice(0, 1200);
        break;
      }
    }
  }
  return { languageId, scope: 'block', currentLine, focus,
    local: masked.slice(Math.max(0, start - 350), (end < 0 ? masked.length : end) + 250),
    imports: '', symbols: '', cues: [],
    recentEdits: input.recentEdits.map(languageId === 'html' ? maskHtml : maskCss).join('\n').slice(-1200) };
}

export const htmlAdapter: LanguageAdapter = { languageId: 'html', extract: input => extract(input, 'html') };
export const cssAdapter: LanguageAdapter = { languageId: 'css', extract: input => extract(input, 'css') };
