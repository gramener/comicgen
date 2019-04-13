import { terser } from 'rollup-plugin-terser'

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
      terser()
    ]
  }
]
