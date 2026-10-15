import { LanguageAdapter } from '../core/types';
import { typescriptAdapter } from './typescript';

// JS and JSX share identity; their catalog is independently authored without types.
export const javascriptAdapter: LanguageAdapter = {
  languageId: 'javascript',
  aliases: ['javascriptreact'],
  extract(input) {
    const context = typescriptAdapter.extract(input);
    return { ...context, languageId: 'javascript', cues: context.scope === 'module'
      ? ['import', 'export', 'function', 'const', 'let'] : context.scope === 'type' ? ['class', 'method'] : [] };
  },
};
