import { terser } from 'rollup-plugin-terser'
import json from '@rollup/plugin-json'
import babel from 'rollup-plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'


export default [
  {
    input: 'src/comicgen.js',
    output: {
      file: 'dist/comicgen.min.js',
      format: 'umd',
      name: 'comicgen',
      sourcemap: true
    },
    plugins: [
      babel({
        exclude: ['node_modules/@babel/**', 'node_modules/core-js/**'],
        presets: [
          [
            '@babel/preset-env',
            {
              targets: 'ie >= 10',
              useBuiltIns: 'usage',
              corejs: 3
            }
          ]
        ]
      }),
      resolve(),
      commonjs(),
      terser(),
      json()
    ]
  }
]
