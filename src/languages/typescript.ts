import { ContextInput, EditorContext, LanguageAdapter, Scope } from '../core/types';
import { scanEcmaScript } from './ecmascript';

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
    const scanned = scanEcmaScript(input.text);
    const masked = scanned.masked;
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
    const line = masked.slice(lineStart, lineEnd).slice(0, 600);
    const preceding = masked.slice(Math.max(0, lineStart - 700), lineStart).split('\n').slice(-4).join('\n');
    const following = masked.slice(lineEnd, lineEnd + 700).split('\n').slice(0, 5).join('\n');
    // Keep module specifiers from genuine imports; commented/string imports stay masked.
    const declarations = [...masked.matchAll(/(?:^|\n)[ \t]*import\b(?!\s*\()/g)].slice(0, 24).flatMap(match => {
      const start = match.index! + match[0].length;
      const sideEffect = /^\s*['"]/.test(input.text.slice(start, start + 1800));
      const declaration = masked.slice(start, start + 1800).split(';')[0]!;
      const from = sideEffect ? undefined : /\bfrom\b/.exec(declaration);
      if (!sideEffect && !from) return [];
      const specifierStart = from ? start + from.index + from[0].length : start;
      const literal = /^\s*(['"])([^'"\r\n]+)\1/.exec(input.text.slice(specifierStart, specifierStart + 1800));
      if (!literal) return [];
      const clause = masked.slice(start, from ? start + from.index : start).trim().replace(/^type\s+/, '');
      const bindings: string[] = [];
      const renamed: { local: string; imported: string }[] = [];
      const defaultName = /^([$\w]+)/.exec(clause)?.[1];
      if (defaultName) bindings.push(defaultName);
      const namespace = /\*\s+as\s+([$\w]+)/.exec(clause)?.[1];
      if (namespace) bindings.push(namespace);
      const named = /\{([^}]*)\}/s.exec(clause)?.[1];
      for (const part of named?.split(',') ?? []) {
        const binding = /^(?:type\s+)?([$\w]+)(?:\s+as\s+([$\w]+))?$/.exec(part.trim());
        if (binding) {
          bindings.push(binding[2] ?? binding[1]!);
          if (binding[2] && binding[2] !== binding[1]) renamed.push({ local: binding[2], imported: binding[1]! });
        }
      }
      return [{ module: literal[2]!, clause, bindings, renamed }];
    });
    const imports = declarations.map(entry => `import ${entry.clause} ${entry.module}`).join('\n').slice(0, 1800);
    const focus = masked.slice(wordStart, wordEnd);
    // Only a binding actually used on this line contributes a library cue. An
    // unrelated import elsewhere must not turn a neutral cursor into a library match.
    const usedModules = declarations.filter(entry => entry.bindings.some(binding =>
      new RegExp(`(?<![$\\w])${binding.replace(/[$]/g, '\\$&')}(?![$\\w])`).test(line))).map(entry => entry.module);
    const focusedModules = declarations.filter(entry => entry.bindings.includes(focus)).map(entry => entry.module);
    const usedAPIs = declarations.flatMap(entry => entry.renamed.filter(binding =>
      new RegExp(`(?<![$\\w])${binding.local.replace(/[$]/g, '\\$&')}(?![$\\w])`).test(line)).map(binding => binding.imported));
    const focusedAPIs = declarations.flatMap(entry => entry.renamed.filter(binding => binding.local === focus).map(binding => binding.imported));
    const jsxCues = scanned.jsx.filter(range => range.start <= lineEnd && range.end >= lineStart).flatMap(range => range.cues);
    const focusCues = focus === 'key' && scanned.jsx.some(range => range.start <= offset && range.end >= offset)
      ? ['react-list'] : [];
    const currentLine = [line, ...new Set(usedModules), ...new Set(usedAPIs), ...new Set(jsxCues)].join(' ');
    return {
      languageId: 'typescript', scope, currentLine, focus: [focus, ...new Set(focusedModules), ...new Set(focusedAPIs), ...focusCues].join(' ').trim(),
      local: scope === 'module' ? currentLine : `${preceding}\n${currentLine}\n${following}`,
      imports, symbols: enclosing.slice(0, 4).map(s => s.name).join(' '),
      recentEdits: input.recentEdits.map(text => scanEcmaScript(text).masked).join('\n').slice(-1800),
      cues: scope === 'module' ? ['import', 'export', 'function', 'interface', 'type alias']
        : scope === 'type' ? ['interface', 'class', 'readonly', 'method'] : [],
    };
  },
};
