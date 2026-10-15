import { ContextInput, EditorContext, LanguageAdapter } from '../core/types';

const blank = (text: string) => text.replace(/[^\r\n]/g, ' ');

/** Preserve offsets and tag attributes, but never treat prose or scripts as HTML cues. */
export function maskHtml(text: string): string {
  return text.replace(/<!--[\s\S]*?(?:-->|$)|<(script|style)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)|<[^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*(?:>|$)|[^<]+/gi,
    token => token.startsWith('<!--') ? blank(token)
      : /^<(script|style)\b/i.test(token) ? token.replace(/^(<[^>]*>)([\s\S]*)$/, (_, tag, body) => tag + blank(body))
      : token.startsWith('<') ? token : blank(token));
}

export function maskCss(text: string): string {
  return text.replace(/@import\s+["']tailwindcss["']|\/\*[\s\S]*?(?:\*\/|$)|"(?:\\[\s\S]|[^"\\])*(?:"|$)|'(?:\\[\s\S]|[^'\\])*(?:'|$)/g, token => token.startsWith('@import') ? token : blank(token));
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
