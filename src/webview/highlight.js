import hljs from 'highlight.js/lib/core';
import rust from 'highlight.js/lib/languages/rust';
import toml from 'highlight.js/lib/languages/ini';
import go from 'highlight.js/lib/languages/go';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';

// Bundle only registered languages; never autodetect or fetch grammars remotely.
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('python', python);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('toml', toml);
hljs.registerLanguage('shellscript', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.configure({ throwUnescapedHTML: true });
hljs.safeMode();

window.SyntaxiserHighlight = {
  highlight(element, languageId) {
    if (!hljs.getLanguage(languageId)) return;
    const source = element.textContent;
    try {
      element.className = `language-${languageId}`;
      hljs.highlightElement(element);
    } catch {
      // A highlighting error should never hide the reference or alter its text.
      element.textContent = source;
      element.className = '';
      delete element.dataset.highlighted;
    }
  },
};
