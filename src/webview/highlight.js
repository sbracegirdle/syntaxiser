import hljs from 'highlight.js/lib/core';
import rust from 'highlight.js/lib/languages/rust';

// Bundle only registered languages; never autodetect or fetch grammars remotely.
hljs.registerLanguage('rust', rust);
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
