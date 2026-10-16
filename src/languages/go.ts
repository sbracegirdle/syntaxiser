import { ContextInput, EditorContext, LanguageAdapter, Scope } from '../core/types';

/** Keep offsets intact while hiding Go comments, interpreted/raw strings and runes. */
export function maskGo(text: string): string {
  return text.replace(/\/\/[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$)|`[^`]*(?:`|$)|"(?:\\[\s\S]|[^"\\])*(?:"|$)|'(?:\\[\s\S]|[^'\\])*(?:'|$)/g,
    token => token.replace(/[^\r\n]/g, ' '));
}

export function goScopeAt(masked: string, offset: number): Scope {
  const stack: Scope[] = ['module'];
  let boundary = 0;
  for (let i = 0; i < offset; i++) {
    const ch = masked[i];
    if (ch === '{') {
      const header = masked.slice(boundary, i).slice(-1000);
      const parent = stack[stack.length - 1]!;
      const scope = /\bfunc\b/.test(header) ? 'function'
        : /\b(?:struct|interface)\s*$/.test(header) ? 'type'
        : parent === 'module' ? 'block' : parent;
      stack.push(scope);
      boundary = i + 1;
    } else if (ch === '}') {
      if (stack.length > 1) stack.pop();
      boundary = i + 1;
    } else if (ch === ';' || ch === '\n') {
      // Newlines delimit declarations, except an unfinished multiline signature.
      const header = masked.slice(boundary, i);
      if (ch === ';' || !/\bfunc\b/.test(header) || header.includes(')')) boundary = i + 1;
    }
  }
  return stack[stack.length - 1]!;
}

export const goAdapter: LanguageAdapter = {
  languageId: 'go',
  extract(input: ContextInput): EditorContext {
    const offset = Math.max(0, Math.min(input.offset, input.text.length));
    const masked = maskGo(input.text);
    const lineStart = masked.lastIndexOf('\n', offset - 1) + 1;
    const nextLine = masked.indexOf('\n', offset);
    const lineEnd = nextLine < 0 ? masked.length : nextLine;
    const enclosing = input.symbols.filter(s => s.start <= offset && s.end >= offset)
      .sort((a, b) => (a.end - a.start) - (b.end - b.start));
    let scope = goScopeAt(masked, offset);
    if (enclosing.some(s => s.kind === 12 || s.kind === 6)) scope = 'function';
    const currentLine = masked.slice(lineStart, lineEnd).slice(0, 600);
    const preceding = masked.slice(Math.max(0, lineStart - 700), lineStart).split('\n').slice(-4).join('\n');
    const following = masked.slice(lineEnd, lineEnd + 700).split('\n').slice(0, 5).join('\n');
    // Preserve import strings while masking comments, including comments inside import blocks.
    const importSource = input.text.replace(/\/\/[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$)|`[^`]*(?:`|$)|"(?:\\[\s\S]|[^"\\])*(?:"|$)|'(?:\\[\s\S]|[^'\\])*(?:'|$)/g,
      token => token.startsWith('//') || token.startsWith('/*') ? token.replace(/[^\r\n]/g, ' ') : token);
    const libraryPaths: Record<string, string> = {
      'github.com/gin-gonic/gin': 'gin',
      'github.com/go-chi/chi/v5': 'chi',
      'github.com/stretchr/testify/assert': 'testify',
      'github.com/stretchr/testify/require': 'testify',
      'github.com/stretchr/testify/mock': 'testify',
    };
    const aliases = new Map<string, string>();
    const importCues = new Set<string>();
    const imports = [...masked.matchAll(/(?:^|\n)[ \t]*import\b/g)].slice(0, 24).map(match => {
      const start = match.index! + match[0].length;
      const leading = importSource.slice(start).match(/^\s*/)?.[0].length ?? 0;
      const bodyStart = start + leading;
      const rest = importSource.slice(bodyStart);
      const close = rest.indexOf(')');
      const body = rest.startsWith('(') ? rest.slice(0, close < 0 ? 1800 : close + 1) : rest.split('\n')[0]!;
      for (const entry of body.matchAll(/(?:^|\n|\()[ \t]*(?:([\w.]+)[ \t]+)?"([^"\r\n]+)"/g)) {
        const path = entry[2]!;
        const topic = libraryPaths[path];
        const alias = entry[1] ?? path.replace(/\/v\d+$/, '').split('/').at(-1)!;
        if (topic && alias !== '_' && alias !== '.') {
          aliases.set(alias, topic);
          if (offset >= match.index! && offset <= bodyStart + body.length) importCues.add(topic);
        }
      }
      return 'import ' + body;
    }).join('\n').slice(0, 1800);
    // Resolve only imported selectors; misleading names and masked literals remain inert.
    const normalizeAliases = (text: string) => text.replace(/\b([A-Za-z_]\w*)\s*\./g,
      (selector, alias: string) => aliases.has(alias) ? `${aliases.get(alias)}.` : selector);
    return {
      languageId: 'go', scope, currentLine: normalizeAliases(currentLine),
      local: normalizeAliases(scope === 'module' ? currentLine : `${preceding}\n${currentLine}\n${following}`),
      imports, symbols: enclosing.slice(0, 4).map(s => s.name).join(' '),
      recentEdits: normalizeAliases(input.recentEdits.map(maskGo).join('\n').slice(-1800)),
      cues: [...importCues, ...(scope === 'module' ? ['package', 'import', 'function', 'struct', 'interface']
        : scope === 'type' ? ['struct', 'interface', 'method'] : [])],
    };
  },
};
