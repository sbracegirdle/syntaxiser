import { ContextInput, EditorContext, LanguageAdapter, Scope } from '../core/types';

/** Hide literals and comments without shifting the cursor or line boundaries. */
export function maskTypeScript(text: string): string {
  const out = text.split('');
  const blank = (start: number, end: number) => {
    for (let n = start; n < end; n++) if (out[n] !== '\n' && out[n] !== '\r') out[n] = ' ';
  };
  let i = 0;
  while (i < text.length) {
    const start = i;
    if (text.startsWith('//', i)) {
      const end = text.indexOf('\n', i);
      i = end < 0 ? text.length : end;
    } else if (text.startsWith('/*', i)) {
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? text.length : end + 2;
    } else if (text[i] === '"' || text[i] === "'" || text[i] === '`') {
      const quote = text[i++];
      while (i < text.length) {
        if (text[i] === '\\') i = Math.min(i + 2, text.length);
        else if (text[i++] === quote) break;
      }
    } else if (text[i] === '/' && /(?:^|[=(:,[!&|?;{}]|\b(?:return|throw|case|yield))\s*$/.test(text.slice(Math.max(0, i - 100), i))) {
      // A slash after an expression is division; after an operator it can open a regex.
      let inClass = false;
      i++;
      while (i < text.length && text[i] !== '\n' && text[i] !== '\r') {
        if (text[i] === '\\') i = Math.min(i + 2, text.length);
        else if (text[i] === '[') { inClass = true; i++; }
        else if (text[i] === ']') { inClass = false; i++; }
        else if (text[i++] === '/' && !inClass) break;
      }
      while (i < text.length && /[a-z]/i.test(text[i]!)) i++;
    } else { i++; continue; }
    blank(start, i);
  }
  return out.join('');
}

export function typescriptScopeAt(masked: string, offset: number): Scope {
  const stack: Scope[] = ['module'];
  let boundary = 0;
  for (let i = 0; i < offset; i++) {
    const ch = masked[i];
    if (ch === '{') {
      const header = masked.slice(boundary, i).slice(-1000).trim();
      const parent = stack[stack.length - 1]!;
      const scope: Scope = /\b(?:class|interface|enum)\s+[$\w]+[^{}]*$/.test(header)
        || /\btype\s+[$\w]+[^=]*=\s*$/.test(header) ? 'type'
        : /=>\s*$/.test(header)
          || /\bfunction\b[^{}]*\)\s*(?::[^{}]+)?$/.test(header)
          || (parent === 'type' && /(?:constructor|[$\w]+)\s*\([^{}]*\)\s*(?::[^{}]+)?$/.test(header)) ? 'function'
          : parent;
      stack.push(scope);
      boundary = i + 1;
    } else if (ch === '}') {
      if (stack.length > 1) stack.pop();
      boundary = i + 1;
    } else if (ch === ';') boundary = i + 1;
  }
  return stack[stack.length - 1]!;
}

export const typescriptAdapter: LanguageAdapter = {
  languageId: 'typescript',
  aliases: ['typescriptreact'],
  extract(input: ContextInput): EditorContext {
    const offset = Math.max(0, Math.min(input.offset, input.text.length));
    const masked = maskTypeScript(input.text);
    const lineStart = masked.lastIndexOf('\n', offset - 1) + 1;
    const nextLine = masked.indexOf('\n', offset);
    const lineEnd = nextLine < 0 ? masked.length : nextLine;
    const enclosing = input.symbols.filter(s => s.start <= offset && s.end >= offset)
      .sort((a, b) => (a.end - a.start) - (b.end - b.start));
    let scope = typescriptScopeAt(masked, offset);
    if (enclosing.some(s => s.kind === 12 || s.kind === 6 || s.kind === 9)) scope = 'function';
    else if (enclosing.some(s => s.kind === 4 || s.kind === 10 || s.kind === 11)) scope = 'type';
    let wordStart = offset;
    let wordEnd = offset;
    while (wordStart > lineStart && /[$\w]/.test(masked[wordStart - 1]!)) wordStart--;
    while (wordEnd < lineEnd && /[$\w]/.test(masked[wordEnd]!)) wordEnd++;
    const currentLine = masked.slice(lineStart, lineEnd).slice(0, 600);
    const preceding = masked.slice(Math.max(0, lineStart - 700), lineStart).split('\n').slice(-4).join('\n');
    const following = masked.slice(lineEnd, lineEnd + 700).split('\n').slice(0, 5).join('\n');
    // Keep module specifiers from genuine imports; commented/string imports stay masked.
    const imports = [...masked.matchAll(/(?:^|\n)[ \t]*import\b(?!\s*\()/g)].slice(0, 24).map(match => {
      const start = match.index! + match[0].length;
      const sideEffect = /^\s*['"]/.test(input.text.slice(start, start + 1800));
      const declaration = masked.slice(start, start + 1800).split(';')[0]!;
      const from = sideEffect ? undefined : /\bfrom\b/.exec(declaration);
      if (!sideEffect && !from) return '';
      const specifierStart = from ? start + from.index + from[0].length : start;
      const literal = /^\s*(['"])([^'"\r\n]+)\1/.exec(input.text.slice(specifierStart, specifierStart + 1800));
      return literal ? `import ${masked.slice(start, specifierStart).trim()} ${literal[2]}` : '';
    }).filter(Boolean).join('\n').slice(0, 1800);
    return {
      languageId: 'typescript', scope, currentLine, focus: masked.slice(wordStart, wordEnd),
      local: scope === 'module' ? currentLine : `${preceding}\n${currentLine}\n${following}`,
      imports, symbols: enclosing.slice(0, 4).map(s => s.name).join(' '),
      recentEdits: input.recentEdits.map(maskTypeScript).join('\n').slice(-1800),
      cues: scope === 'module' ? ['import', 'export', 'function', 'interface', 'type alias']
        : scope === 'type' ? ['interface', 'class', 'readonly', 'method'] : [],
    };
  },
};
