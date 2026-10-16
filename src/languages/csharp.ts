import { ContextInput, EditorContext, LanguageAdapter, Scope } from '../core/types';

/** Mask literal bodies and comments, preserving offsets through incomplete edits. */
export function maskCsharp(text: string): string {
  const chars = text.split('');
  const hide = (start: number, end: number) => {
    for (let k = start; k < end; k++) if (chars[k] !== '\n' && chars[k] !== '\r') chars[k] = ' ';
  };
  const literalEnd = (start: number): number | undefined => {
    const prefix = text.slice(start).match(/^(?:\$+@?|@\$?)?("{3,}|"|')/);
    if (!prefix) return undefined;
    const delimiter = prefix[1]!;
    const verbatim = prefix[0].includes('@');
    const interpolated = prefix[0].includes('$');
    let i = start + prefix[0].length, depth = 0;
    while (i < text.length) {
      if (delimiter.length >= 3) {
        if (text.startsWith(delimiter, i)) return i + delimiter.length;
        i++; continue;
      }
      if (depth > 0) {
        // An interpolation expression can contain strings and braces of its own.
        if (text.startsWith('//', i)) {
          const next = text.indexOf('\n', i); i = next < 0 ? text.length : next; continue;
        }
        if (text.startsWith('/*', i)) {
          const next = text.indexOf('*/', i + 2); i = next < 0 ? text.length : next + 2; continue;
        }
        const nested = /["'@$]/.test(text[i]!) ? literalEnd(i) : undefined;
        if (nested !== undefined) { i = nested; continue; }
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
        i++; continue;
      }
      if (interpolated && text[i] === '{') {
        if (text[i + 1] === '{') { i += 2; continue; }
        depth = 1; i++; continue;
      }
      if (verbatim && text.startsWith('""', i)) { i += 2; continue; }
      if (text[i] === delimiter) return i + 1;
      if (!verbatim && text[i] === '\\') { i += Math.min(2, text.length - i); continue; }
      if (!verbatim && (text[i] === '\n' || text[i] === '\r')) return i;
      i++;
    }
    return i;
  };
  for (let i = 0; i < text.length;) {
    const start = i;
    if (text.startsWith('//', i)) {
      i = text.indexOf('\n', i); if (i < 0) i = text.length;
    } else if (text.startsWith('/*', i)) {
      const end = text.indexOf('*/', i + 2); i = end < 0 ? text.length : end + 2;
    } else {
      const end = /["'@$]/.test(text[i]!) ? literalEnd(i) : undefined;
      if (end === undefined) { i++; continue; }
      i = end;
    }
    hide(start, i);
  }
  return chars.join('');
}

export function csharpScopeAt(masked: string, offset: number): Scope {
  const stack: Scope[] = ['module'];
  let boundary = 0;
  for (let i = 0; i < offset; i++) {
    if (masked[i] === '{') {
      const header = masked.slice(boundary, i).slice(-1500);
      const parent = stack[stack.length - 1]!;
      const scope: Scope = /\bnamespace\s+[\w.]+/.test(header) ? 'module'
        : /\b(?:class|interface|enum|struct|record(?:\s+(?:class|struct))?)\s+\w+/.test(header) ? 'type'
        : /=>\s*$/.test(header) || parent === 'type' && (/\)\s*(?:where\b[\s\S]*)?$/.test(header)
          || /\b(?:get|set|init|add|remove)\s*$/.test(header)) ? 'function'
        : parent === 'module' ? 'block' : parent;
      stack.push(scope); boundary = i + 1;
    } else if (masked[i] === '}') {
      if (stack.length > 1) stack.pop(); boundary = i + 1;
    } else if (masked[i] === ';') boundary = i + 1;
  }
  return stack[stack.length - 1]!;
}

export const csharpAdapter: LanguageAdapter = {
  languageId: 'csharp',
  extract(input: ContextInput): EditorContext {
    const offset = Math.max(0, Math.min(input.offset, input.text.length));
    const masked = maskCsharp(input.text);
    const lineStart = masked.lastIndexOf('\n', offset - 1) + 1;
    const next = masked.indexOf('\n', offset);
    const lineEnd = next < 0 ? masked.length : next;
    const line = masked.slice(lineStart, lineEnd).slice(0, 600);
    const declarations = [...masked.matchAll(/(?:^|(?<=[;\n]))\s*(?:global\s+)?using\s+(?:(static)\s+)?(?:(\w+)\s*=\s*)?((?:global::)?[\w.]+)\s*;/g)]
      .slice(0, 40).map(m => ({ path: m[3]!, binding: m[2] ?? '', static: !!m[1] }));
    const used = declarations.filter(d => d.binding && new RegExp(`\\b${d.binding}\\b`).test(line));
    let start = offset, end = offset;
    while (start > lineStart && /[\w@]/.test(masked[start - 1]!)) start--;
    while (end < lineEnd && /[\w@]/.test(masked[end]!)) end++;
    const word = masked.slice(start, end);
    const enclosing = input.symbols.filter(s => s.start <= offset && s.end >= offset)
      .sort((a, b) => (a.end - a.start) - (b.end - b.start));
    let scope = csharpScopeAt(masked, offset);
    if (enclosing.some(s => [5, 8, 11].includes(s.kind))) scope = 'function';
    else if (enclosing.some(s => [4, 9, 10, 22].includes(s.kind))) scope = 'type';
    const currentLine = [line, ...used.map(d => d.path)].join(' ');
    return { languageId: 'csharp', scope, currentLine,
      focus: [word, ...used.filter(d => d.binding === word).map(d => d.path)].join(' '),
      local: scope === 'module' ? currentLine : masked.slice(Math.max(0, lineStart - 600), lineStart).split('\n').slice(-3).join('\n') + '\n' + currentLine,
      imports: declarations.map(d => d.path).join('\n').slice(0, 1800),
      symbols: enclosing.slice(0, 4).map(s => s.name).join(' '),
      recentEdits: input.recentEdits.map(maskCsharp).join('\n').slice(-1800), cues: [] };
  },
};
