import hljs from 'highlight.js/lib/core';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import bash from 'highlight.js/lib/languages/bash';
import typescript from 'highlight.js/lib/languages/typescript';

// Bundle only registered languages; never autodetect or fetch grammars remotely.
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('shellscript', bash);
hljs.registerLanguage('typescript', typescript);
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
