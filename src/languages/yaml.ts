import { ContextInput, EditorContext, LanguageAdapter } from '../core/types';

export type YamlSchema = 'yaml' | 'github' | 'cfn' | 'compose';

/** Tolerant lexical masking, not validation. Keep offsets, keys and YAML tags. */
export function maskYaml(text: string): string {
  let quote = '', blockIndent: number | undefined;
  return text.split('\n').map(line => {
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    if (blockIndent !== undefined) {
      if (!line.trim() || indent > blockIndent) return line.replace(/[^\r]/g, ' ');
      blockIndent = undefined;
    }
    let result = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (quote) {
        const expression = line.slice(i).match(/^\$\{\{[^\r\n]*?\}\}/)?.[0];
        if (expression) { result += expression; i += expression.length - 1; continue; }
        result += ' ';
        if (quote === '"' && ch === '\\') { if (i + 1 < line.length) { i++; result += ' '; } }
        else if (ch === quote) {
          if (quote === "'" && line[i + 1] === "'") { i++; result += ' '; }
          else quote = '';
        }
      } else if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]!))) {
        result += ' '.repeat(line.length - i); break;
      } else if ((ch === '"' || ch === "'") && (i === 0 || /[\s:[{,\-]/.test(line[i - 1]!))) {
        // Quoted simple mapping keys remain useful; quoted values never become cues.
        const key = line.slice(i).match(/^(?:"([\w.-]+)"|'([\w.-]+)')(?=\s*:)/);
        if (key) { result += key[0]; i += key[0].length - 1; }
        else { quote = ch; result += ' '; }
      } else result += ch;
    }
    if (!quote && /(?:^|:\s+|-\s+)[>|](?:[1-9][+-]?|[+-][1-9]?)?\s*$/.test(result)) {
      blockIndent = indent + (/^\s*-\s+[^:]+:/.test(result) ? 2 : 0);
    }
    return result;
  }).join('\n');
}

export function yamlSchema(text: string, filePath = ''): YamlSchema {
  const path = filePath.replace(/\\/g, '/').toLowerCase();
  if (/(?:^|\/)\.github\/workflows\/[^/]+\.ya?ml$/.test(path)) return 'github';
  if (/(?:^|\/)action\.ya?ml$/.test(path) && /^runs\s*:/m.test(maskYaml(text))
    && /^\s+using\s*:\s*(?:composite|"composite"|'composite')\s*(?:#.*)?$/m.test(text)) return 'github';
  if (/(?:^|\/)(?:docker-)?compose(?:[.-][^/]*)?\.ya?ml$/.test(path)) return 'compose';
  const masked = maskYaml(text);
  if (/^(?:AWSTemplateFormatVersion|['"]AWSTemplateFormatVersion['"])\s*:/m.test(masked)
    || (/^Resources\s*:/m.test(masked) && /\bType\s*:\s*AWS::[\w:]+/.test(masked))) return 'cfn';
  if (/^(?:jobs|['"]jobs['"])\s*:/m.test(masked) && /^(?:on|['"]on['"])\s*:/m.test(masked)) return 'github';
  if (/^(?:services|['"]services['"])\s*:/m.test(masked)) return 'compose';
  if (/(?:^|\/)(?:cloudformation|cfn|template)(?:[.-][^/]*)?\.ya?ml$/.test(path)) return 'cfn';
  return 'yaml';
}

function extract(input: ContextInput): EditorContext {
  // Schema cues in another YAML document must not affect the active document.
  const allMasked = maskYaml(input.text);
  const absolute = Math.max(0, Math.min(input.offset, allMasked.length));
  const boundaries = [...allMasked.matchAll(/^(?:---|\.\.\.)\s*$/gm)];
  const start = boundaries.filter(m => m.index! < absolute).at(-1)?.index ?? 0;
  const end = boundaries.find(m => m.index! > absolute)?.index ?? input.text.length;
  const text = input.text.slice(start, end);
  const masked = allMasked.slice(start, end);
  const offset = absolute - start;
  const lines = masked.split('\n');
  const row = masked.slice(0, offset).split('\n').length - 1;
  const schema = yamlSchema(text, input.filePath);
  const ancestors: string[] = [];
  let indent = (lines[row]!.match(/^\s*/)?.[0].length ?? 0) + 1;
  for (let i = row; i >= 0; i--) {
    const line = lines[i]!;
    if (/^(?:---|\.\.\.)\s*$/.test(line)) break;
    const depth = line.match(/^\s*/)?.[0].length ?? 0;
    if (line.trim() && depth < indent) { ancestors.unshift(line); indent = depth; }
  }
  const keys = ancestors.join('\n');
  const cues: string[] = [];
  // Translate schema keys rather than treating identical keys as universal APIs.
  const add = (pattern: RegExp, cue: string) => { if (pattern.test(keys)) cues.push(cue); };
  if (schema === 'github') {
    add(/\b(?:on|push|pull_request|workflow_dispatch)\b/, 'github actions triggers');
    add(/\b(?:jobs|steps|runs-on|run|uses)\b/, 'github actions jobs steps');
    add(/\bneeds\b/, 'github actions needs');
    add(/\b(?:strategy|matrix)\b/, 'github actions matrix');
    add(/\bpermissions\b/, 'workflow permissions');
    add(/\b(?:env|secrets|environment)\b/, 'github actions environment secrets');
    add(/actions\/(?:cache|setup-node)|\bcache\b/, 'github actions cache');
    add(/actions\/(?:upload|download)-artifact|\bartifact\b/, 'github actions artifacts');
    add(/\$\{\{|\bif\s*:/, 'github actions expressions');
    add(/\bworkflow_call\b/, 'reusable workflow outputs');
    add(/\b(?:inputs|outputs)\b/, /\bruns\s*:|\bcomposite\b/.test(masked) ? 'local composite action' : 'reusable workflow outputs');
    add(/\b(?:runs|composite)\b/, 'local composite action');
    add(/\b(?:concurrency|cancel-in-progress)\b/, 'workflow concurrency cancellation');
    add(/\bif\s*:|\b(?:always|cancelled|failure)\(\)|needs\.[\w-]+\.result/, 'job conditions');
  } else if (schema === 'cfn') {
    add(/\bParameters\b/, 'cloudformation parameter');
    add(/\bResources\b/, 'cloudformation resource');
    add(/\bOutputs\b/, 'cloudformation output');
    add(/!(?:Ref|Sub|GetAtt|Join|Select)|\b(?:Ref|Fn::\w+)\b/, 'intrinsic ref');
    add(/\bConditions?\b|!(?:If|Equals|And|Or|Not)\b/, 'cloudformation conditions');
    add(/\bMappings\b|!FindInMap|Fn::FindInMap/, 'cloudformation mapping');
    add(/\b(?:RedrivePolicy|deadLetterTargetArn|Tags)\b/, 'cloudformation nested properties');
    add(/!Join|Fn::(?:Join|Sub)/, 'cloudformation intrinsic composition');
  } else if (schema === 'compose') {
    add(/\b(?:services|image|ports|command)\b/, 'compose services ports');
    add(/\bvolumes\b/, 'compose volume');
    add(/\bnetworks\b/, 'compose networks');
    add(/\b(?:environment|env_file)\b/, 'compose environment');
    add(/\b(?:healthcheck|depends_on)\b/, 'compose healthcheck');
    add(/\b(?:build|dockerfile_inline|args)\s*:/, 'compose build config');
    add(/\bprofiles\s*:/, 'compose profiles');
    add(/!(?:reset|override)\b/, 'compose override merge');
  }
  add(/!!(?:str|int|bool|null|float)\b/, 'yaml tag scalar');
  add(/<<\s*:/, 'yaml merge key');
  if (/^(?:---|\.\.\.)\s*$/m.test(lines[row]!)) cues.push('multidocument yaml');
  const currentLine = lines[row]!.slice(0, 800);
  return { languageId: 'yaml', scope: 'block', currentLine, focus: `${currentLine}\n${cues.join(' ')}`,
    local: `${keys.slice(-1800)}\n${cues.join(' ')}`, imports: '', symbols: '', recentEdits: '', cues,
    topicPrefixes: schema === 'yaml' ? ['yaml-'] : ['yaml-', `${schema}-`] };
}

export const yamlAdapter: LanguageAdapter = { languageId: 'yaml', extract };
