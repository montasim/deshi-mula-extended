import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'content.ts',
    output: {
        file: 'dist/content.js',
        format: 'iife', // Self-contained function
        name: 'LeetDecoder',
        sourcemap: true,
    },
    plugins: [
        typescript(), // First, let TypeScript compile
        resolve({ extensions: ['.ts', '.js'] }),
        commonjs(),
    ],
};
