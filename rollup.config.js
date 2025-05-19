import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
    input: 'src/content.ts', // your main entry point
    output: {
        file: 'dist/bundle.js',
        format: 'iife', // Immediately Invoked Function Expression (works in browsers)
        name: 'DeshiMulaExtension',
    },
    plugins: [
        json(),
        typescript(), // compiles TS
    ],
};
