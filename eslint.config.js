import plugin from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@typescript-eslint': plugin,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            semi: ['error', 'always'],
            quotes: ['error', 'single'],
        },
    },
];
