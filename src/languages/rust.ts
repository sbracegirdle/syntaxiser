import { ContextInput, EditorContext, LanguageAdapter, Scope } from '../core/types';

/** Preserve offsets/newlines while hiding comments and literals from scope analysis.
 * Rust lifetimes remain visible; quoted chars and raw strings do not. */
export function maskRust(text: string): string {
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
      i += 2;
      let depth = 1;
      while (i < text.length && depth) {
        if (text.startsWith('/*', i)) { depth++; i += 2; }
        else if (text.startsWith('*/', i)) { depth--; i += 2; }
        else i++;
      }
    } else {
      const raw = /^(?:br|r)(#{0,255})"/.exec(text.slice(i, i + 260));
      if (raw) {
        const endToken = `"${raw[1]}`;
        const end = text.indexOf(endToken, i + raw[0].length);
        i = end < 0 ? text.length : end + endToken.length;
      } else if (text[i] === '"') {
        i++;
        while (i < text.length) {
          if (text[i] === '\\') i += 2;
          else if (text[i++] === '"') break;
        }
        i = Math.min(i, text.length);
      } else if (text[i] === "'") {
        const character = /^'(?:\\(?:u\{[0-9a-fA-F_]+\}|x[0-9a-fA-F]{2}|[^\n])|[^'\\\n])'/.exec(text.slice(i, i + 20));
        if (character) i += character[0].length;
        else { i++; continue; }
      } else { i++; continue; }
    }
    blank(start, i);
  }
  return out.join('');
}

export function scopeAt(masked: string, offset: number): Scope {
  const stack: { scope: Scope; importGroup: boolean }[] = [{ scope: 'module', importGroup: false }];
  let boundary = 0;
  for (let i = 0; i < offset; i++) {
    const ch = masked[i];
    if (ch === '{') {
      const header = masked.slice(boundary, i).slice(-1000);
      const parent = stack[stack.length - 1]!;
      const importGroup = parent.importGroup || /\buse\s+/.test(header);
      let next: Scope;
      if (importGroup) next = parent.scope;
      else if (/\bfn\s+\w+/.test(header)) next = 'function';
      else if (/\btrait\s+\w+/.test(header)) next = 'trait';
      else if (/\bimpl\b/.test(header)) next = 'implementation';
      else if (/\b(?:struct|enum|union)\s+\w+/.test(header)) next = 'type';
      else if (/\bmod\s+\w+/.test(header)) next = 'module';
      else next = parent.scope === 'module' ? 'block' : parent.scope;
      stack.push({ scope: next, importGroup });
      boundary = i + 1;
    } else if (ch === '}') {
      if (stack.length > 1) stack.pop();
      boundary = i + 1;
    } else if (ch === ';') boundary = i + 1;
  }
  return stack[stack.length - 1]?.scope ?? 'module';
}

export const rustAdapter: LanguageAdapter = {
  languageId: 'rust',
  extract(input: ContextInput): EditorContext {
    const offset = Math.max(0, Math.min(input.offset, input.text.length));
    const masked = maskRust(input.text);
    const lineStart = masked.lastIndexOf('\n', offset - 1) + 1;
    const nextLine = masked.indexOf('\n', offset);
    const lineEnd = nextLine < 0 ? masked.length : nextLine;
    // Adjacent declarations should not drown out a cursor at module scope.
    const preceding = masked.slice(Math.max(0, lineStart - 700), lineStart).split('\n').slice(-4).join('\n');
    const following = masked.slice(lineEnd, lineEnd + 700).split('\n').slice(0, 5).join('\n');
    const enclosing = input.symbols.filter(s => s.start <= offset && s.end >= offset)
      .sort((a, b) => (a.end - a.start) - (b.end - b.start));
    let scope = scopeAt(masked, offset);
    // Function/method symbols from rust-analyzer refine the scanner, including signatures.
    if (enclosing.some(s => s.kind === 12 || s.kind === 6)) scope = 'function';
    const currentLine = masked.slice(lineStart, lineEnd).slice(0, 600);
    const imports = (masked.match(/(?:^|\n)\s*(?:pub(?:\([^)]*\))?\s+)?use\s+[^;]+;/g) ?? [])
      .slice(0, 24).join('\n').slice(0, 1800);
    const cues = scope === 'module' ? ['imports', 'function', 'module', 'struct', 'enum']
      : scope === 'trait' ? ['trait', 'associated type', 'generic']
      : scope === 'implementation' ? ['method', 'trait', 'generic']
      : scope === 'type' ? ['struct', 'enum', 'derive', 'lifetime'] : [];
    return {
      languageId: 'rust', scope, currentLine,
      local: scope === 'module' ? currentLine : `${preceding}\n${currentLine}\n${following}`,
      imports, symbols: enclosing.slice(0, 4).map(s => s.name).join(' '),
      recentEdits: input.recentEdits.map(maskRust).join('\n').slice(-1800), cues,
    };
  },
};
