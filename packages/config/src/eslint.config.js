import js from '@eslint/js';
import ts from 'typescript-eslint';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    ignores: ['dist', 'dist-*', 'out', 'coverage'],
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="setTimeout"][arguments.length<2]',
          message: 'setTimeout must always include a delay to avoid throttling.',
        },
      ],
    },
  }
);
