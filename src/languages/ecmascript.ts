/** A bounded, tolerant lexical view of JS/TS, JSX and template expressions.
 * Offsets and newlines survive masking, including while a tag is incomplete. */
export function scanEcmaScript(text: string): { masked: string; jsx: { start: number; end: number; cues: string[] }[] } {
  const out: string[] = [];
  // Use UTF-16 units, as editor offsets do (including astral characters).
  for (let n = 0; n < text.length; n++) out.push(/[\r\n]/.test(text[n]!) ? text[n]! : ' ');
  const jsx: { start: number; end: number; cues: string[] }[] = [];
  let i = 0;
  let nesting = 0;
  const copy = () => { out[i] = text[i]!; i++; };
  const quoted = (quote: string) => {
    i++;
    while (i < text.length) {
      if (text[i] === '\\') i += 2;
      else if (text[i++] === quote) break;
    }
  };
  const template = () => {
    i++;
    while (i < text.length) {
      if (text[i] === '\\') i += 2;
      else if (text[i] === '`') { i++; return; }
      else if (text.startsWith('${', i)) { i += 2; code(true); }
      else i++;
    }
  };
  const element = () => {
    if (nesting >= 128) { i = text.length; return; }
    nesting++;
    const start = i;
    const cues = ['jsx', 'react'];
    i++; // <
    let header = '';
    while (i < text.length && text[i] !== '>') {
      if (text[i] === '"' || text[i] === "'") quoted(text[i]!);
      else if (text[i] === '{') { i++; code(true); }
      else { header += text[i]; copy(); }
    }
    if (/\bon(?:Click|Change|Submit|KeyDown)\b/.test(header)) cues.push('react-events');
    if (/\bref\b/.test(header)) cues.push('react-ref');
    if (/\bkey\s*=/.test(header)) cues.push('react-list');
    if (header.trim()) cues.push('react-props');
    const selfClosing = /\/\s*$/.test(header);
    if (i < text.length) i++;
    if (!selfClosing) while (i < text.length) {
      if (text.startsWith('</', i)) {
        i += 2;
        while (i < text.length && text[i] !== '>') i++;
        if (i < text.length) i++;
        break;
      }
      if (text[i] === '<' && /^(?:<[A-Za-z][\w.:-]*(?=[\s/>])|<>)/.test(text.slice(i))) element();
      else if (text[i] === '{') { i++; code(true); }
      else i++; // JSX child text is not executable code.
    }
    jsx.push({ start, end: i, cues });
    nesting--;
  };
  const code = (expression = false) => {
    if (nesting >= 128) { i = text.length; return; }
    nesting++;
    let depth = 0;
    while (i < text.length) {
      if (expression && text[i] === '}' && depth === 0) { i++; nesting--; return; }
      if (text.startsWith('//', i)) { while (i < text.length && text[i] !== '\n') i++; }
      else if (text.startsWith('/*', i)) {
        const end = text.indexOf('*/', i + 2); i = end < 0 ? text.length : end + 2;
      } else if (text[i] === '"' || text[i] === "'") quoted(text[i]!);
      else if (text[i] === '`') template();
      else if (text[i] === '/' && /(?:^|[=(:,[!&|?;{}]|\b(?:return|throw|case|yield))\s*$/.test(out.slice(Math.max(0, i - 100), i).join(''))) {
        let inClass = false;
        i++;
        while (i < text.length && !/[\r\n]/.test(text[i]!)) {
          if (text[i] === '\\') i += 2;
          else if (text[i] === '[') { inClass = true; i++; }
          else if (text[i] === ']') { inClass = false; i++; }
          else if (text[i++] === '/' && !inClass) break;
        }
        while (i < text.length && /[a-z]/i.test(text[i]!)) i++;
      } else if (text[i] === '<' && /^(?:<[A-Za-z][\w.:-]*(?=[\s/>])|<>)/.test(text.slice(i))
        && !/^<[A-Za-z][\w]*>\s*\(/.test(text.slice(i))
        && /(?:^|[=(,:?\[>{;]|\breturn)\s*$/.test(out.slice(Math.max(0, i - 100), i).join(''))) element();
      else {
        if (text[i] === '{') depth++;
        if (text[i] === '}') depth--;
        copy();
      }
    }
    nesting--;
  };
  code();
  return { masked: out.join(''), jsx };
}
