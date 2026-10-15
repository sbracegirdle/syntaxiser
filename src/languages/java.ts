import { ContextInput, EditorContext, LanguageAdapter, Scope } from '../core/types';

/** Hide comments, character/string literals and text blocks without moving offsets. */
export function maskJava(text: string): string {
  return text.replace(/\/\/[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$)|"""(?:\\[\s\S]|(?!""")[\s\S])*(?:"""|$)|"(?:\\[^\r\n]|[^"\\\r\n])*(?:"|(?=\r|\n)|$)|'(?:\\[^\r\n]|[^'\\\r\n])*(?:'|(?=\r|\n)|$)/g,
    token => token.replace(/[^\r\n]/g, ' '));
}

export function javaScopeAt(masked: string, offset: number): Scope {
  const stack: Scope[] = ['module'];
  let boundary = 0;
  for (let i = 0; i < offset; i++) {
    const ch = masked[i];
    if (ch === '{') {
      const header = masked.slice(boundary, i).slice(-1500);
      const parent = stack[stack.length - 1]!;
      const scope = /\b(?:class|interface|enum|record)\s+\w+/.test(header) ? 'type'
        : /->\s*$/.test(header) || parent === 'type' && (/\)\s*(?:throws\s+[\w.,\s]+)?$/.test(header)
          || /^\s*(?:(?:public|protected|private)\s+)?\w*\s*$/.test(header)) ? 'function' : parent === 'module' ? 'block' : parent;
      stack.push(scope);
      boundary = i + 1;
    } else if (ch === '}') {
      if (stack.length > 1) stack.pop();
      boundary = i + 1;
    } else if (ch === ';') boundary = i + 1;
  }
  return stack[stack.length - 1]!;
}

export const javaAdapter: LanguageAdapter = {
  languageId: 'java',
  extract(input: ContextInput): EditorContext {
    const offset = Math.max(0, Math.min(input.offset, input.text.length));
    const masked = maskJava(input.text);
    const lineStart = masked.lastIndexOf('\n', offset - 1) + 1;
    const next = masked.indexOf('\n', offset);
    const lineEnd = next < 0 ? masked.length : next;
    const line = masked.slice(lineStart, lineEnd).slice(0, 600);
    const declarations = [...masked.matchAll(/\bimport\s+(static\s+)?([\w.]+)(\.\*)?\s*;/g)].slice(0, 40)
      .map(m => ({ path: m[2]!, binding: m[3] ? '' : m[2]!.split('.').pop()! }));
    const used = declarations.filter(d => d.binding && new RegExp(`\\b${d.binding}\\b`).test(line));
    let start = offset, end = offset;
    while (start > lineStart && /[\w$]/.test(masked[start - 1]!)) start--;
    while (end < lineEnd && /[\w$]/.test(masked[end]!)) end++;
    const word = masked.slice(start, end);
    const enclosing = input.symbols.filter(s => s.start <= offset && s.end >= offset)
      .sort((a, b) => (a.end - a.start) - (b.end - b.start));
    let scope = javaScopeAt(masked, offset);
    // VS Code SymbolKind values: Method, Constructor, Function; Class, Enum, Interface, Struct.
    if (enclosing.some(s => [5, 8, 11].includes(s.kind))) scope = 'function';
    else if (enclosing.some(s => [4, 9, 10, 22].includes(s.kind))) scope = 'type';
    const currentLine = [line, ...used.map(d => d.path)].join(' ');
    return { languageId: 'java', scope, currentLine,
      focus: [word, ...used.filter(d => d.binding === word).map(d => d.path)].join(' '),
      local: scope === 'module' ? currentLine : masked.slice(Math.max(0, lineStart - 600), lineStart).split('\n').slice(-3).join('\n') + '\n' + currentLine,
      imports: declarations.map(d => d.path).join('\n').slice(0, 1800),
      symbols: enclosing.slice(0, 4).map(s => s.name).join(' '),
      recentEdits: input.recentEdits.map(maskJava).join('\n').slice(-1800), cues: [] };
  },
};
