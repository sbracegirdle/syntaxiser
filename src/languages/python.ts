import { ContextInput, EditorContext, LanguageAdapter, Scope } from '../core/types';

/** A lexical fallback: retain line endings and offsets, hide comments and literals.
 * F-string contents are deliberately hidden as a whole, including expressions. */
export function maskPython(text: string): string {
  const out = text.split('');
  let i = 0;
  while (i < text.length) {
    const start = i;
    if (text[i] === '#') {
      const end = text.indexOf('\n', i);
      i = end < 0 ? text.length : end;
    } else if (text[i] === '"' || text[i] === "'") {
      const quote = text[i]!;
      const triple = text.startsWith(quote.repeat(3), i);
      const delimiter = quote.repeat(triple ? 3 : 1);
      // Remove prefixes too, so f/r/b/u do not become accidental topic cues.
      let prefix = start;
      while (prefix > 0 && /[frbu]/i.test(text[prefix - 1]!)) prefix--;
      const prefixStart = prefix === 0 || !/[\w]/.test(text[prefix - 1]!) ? prefix : start;
      for (let n = prefixStart; n < start; n++) out[n] = ' ';
      const stack = [{ delimiter, formatted: /f/i.test(text.slice(prefixStart, start)), braces: 0 }];
      i += delimiter.length;
      while (i < text.length && stack.length) {
        const frame = stack[stack.length - 1]!;
        if (text[i] === '\\') { i = Math.min(i + 2, text.length); continue; }
        if (!frame.braces && text.startsWith(frame.delimiter, i)) {
          i += frame.delimiter.length;
          stack.pop();
          continue;
        }
        if (!frame.braces && frame.delimiter.length === 1 && /[\r\n]/.test(text[i]!)) break;
        if (frame.formatted) {
          if (frame.braces && text[i] === '#') {
            const end = text.indexOf('\n', i);
            i = end < 0 ? text.length : end;
            continue;
          }
          if (frame.braces && (text[i] === '"' || text[i] === "'")) {
            const quote = text[i]!;
            const nested = text.startsWith(quote.repeat(3), i) ? quote.repeat(3) : quote;
            // Stack frames handle same-quote and nested f-strings without recursion.
            const formatted = /(?:^|[^\w])[frbu]*f[frbu]*$/i.test(text.slice(Math.max(0, i - 8), i));
            stack.push({ delimiter: nested, formatted, braces: 0 });
            i += nested.length;
            continue;
          }
          if (!frame.braces && (text.startsWith('{{', i) || text.startsWith('}}', i))) { i += 2; continue; }
          if (text[i] === '{') frame.braces++;
          else if (text[i] === '}' && frame.braces) frame.braces--;
        }
        i++;
      }
    } else { i++; continue; }
    for (let n = start; n < i; n++) if (out[n] !== '\n' && out[n] !== '\r') out[n] = ' ';
  }
  return out.join('');
}

const indentation = (line: string) => (line.match(/^[ \t]*/)?.[0] ?? '').replace(/\t/g, '        ').length;
export function pythonScopeAt(masked: string, offset: number): Scope {
  const stack: { indent: number; scope: Scope }[] = [];
  const lines = masked.slice(0, offset).split('\n');
  let depth = 0;
  let continued = false;
  let header = '';
  let headerIndent = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const target = i === lines.length - 1;
    const indent = indentation(line);
    if (!depth && !continued && (line.trim() || target)) {
      while (stack.length && indent <= stack[stack.length - 1]!.indent) stack.pop();
    }
    if (target) break;
    if (!depth && !continued) { header = line; headerIndent = indent; }
    else header += ' ' + line.trim();
    for (const ch of line) {
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth = Math.max(0, depth - 1);
    }
    continued = /\\\s*$/.test(line);
    if (!depth && !continued && /:\s*$/.test(header)) {
      const parent = stack[stack.length - 1]?.scope ?? 'module';
      stack.push({ indent: headerIndent, scope: /^\s*(?:async\s+)?def\b/.test(header) ? 'function'
        : /^\s*class\b/.test(header) ? 'type' : parent });
    }
  }
  return stack[stack.length - 1]?.scope ?? 'module';
}

export const pythonAdapter: LanguageAdapter = {
  languageId: 'python',
  extract(input: ContextInput): EditorContext {
    const offset = Math.max(0, Math.min(input.offset, input.text.length));
    const masked = maskPython(input.text);
    const lineStart = masked.lastIndexOf('\n', offset - 1) + 1;
    const next = masked.indexOf('\n', offset);
    const lineEnd = next < 0 ? masked.length : next;
    const line = masked.slice(lineStart, lineEnd).slice(0, 600);
    const declarations: { module: string; binding: string; original: string }[] = [];
    for (const match of masked.matchAll(/^[ \t]*(?:from\s+([\w.]+)\s+import\s+(\([^)]*\)|[^\r\n;]+)|import\s+([^\r\n;]+))/gm)) {
      for (const part of (match[2] ?? match[3] ?? '').replace(/[()]/g, '').split(',')) {
        const name = /^\s*([\w.]+)(?:\s+as\s+(\w+))?\s*$/.exec(part);
        if (name) declarations.push({ module: match[1] ?? name[1]!,
          binding: name[2] ?? (match[1] ? name[1]! : name[1]!.split('.')[0]!), original: name[1]! });
      }
      if (declarations.length >= 24) break;
    }
    let start = offset, end = offset;
    while (start > lineStart && /\w/.test(masked[start - 1]!)) start--;
    while (end < lineEnd && /\w/.test(masked[end]!)) end++;
    const word = masked.slice(start, end);
    const used = declarations.filter(entry => new RegExp(`\\b${entry.binding}\\b`).test(line));
    const cues = used.map(entry => `${entry.module} ${entry.original}`);
    const currentLine = [line, ...new Set(cues)].join(' ');
    const enclosing = input.symbols.filter(s => s.start <= offset && s.end >= offset)
      .sort((a, b) => (a.end - a.start) - (b.end - b.start));
    let scope = pythonScopeAt(masked, lineStart + (input.text.slice(lineStart, lineEnd).match(/^[ \t]*/)?.[0].length ?? 0));
    if (enclosing.some(s => [6, 9, 12].includes(s.kind))) scope = 'function';
    else if (enclosing.some(s => [4, 10, 11].includes(s.kind))) scope = 'type';
    return { languageId: 'python', scope, currentLine,
      focus: [word, ...used.filter(entry => entry.binding === word).map(entry => `${entry.module} ${entry.original}`)].join(' '),
      local: scope === 'module' ? currentLine : [masked.slice(Math.max(0, lineStart - 600), lineStart).split('\n').slice(-3).join('\n'), currentLine].join('\n'),
      imports: declarations.map(entry => `${entry.module} ${entry.original} ${entry.binding}`).join('\n').slice(0, 1800),
      symbols: enclosing.slice(0, 4).map(s => s.name).join(' '),
      recentEdits: input.recentEdits.map(maskPython).join('\n').slice(-1800), cues: [] };
  },
};
