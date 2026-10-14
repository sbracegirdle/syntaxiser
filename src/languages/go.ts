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
    // Import paths are string literals: extract from source, excluding commented declarations.
    const imports = [...masked.matchAll(/(?:^|\n)[ \t]*import\b/g)].slice(0, 24).map(match => {
      const start = match.index! + match[0].length;
      const rest = input.text.slice(start).trimStart();
      return 'import ' + (rest.startsWith('(') ? rest.slice(0, rest.indexOf(')') + 1) : rest.split('\n')[0]);
    }).join('\n').slice(0, 1800);
    return {
      languageId: 'go', scope, currentLine,
      local: scope === 'module' ? currentLine : `${preceding}\n${currentLine}\n${following}`,
      imports, symbols: enclosing.slice(0, 4).map(s => s.name).join(' '),
      recentEdits: input.recentEdits.map(maskGo).join('\n').slice(-1800),
      cues: scope === 'module' ? ['package', 'import', 'function', 'struct', 'interface']
        : scope === 'type' ? ['struct', 'interface', 'method'] : [],
    };
  },
};
