import { terser } from 'rollup-plugin-terser'

export default [
  {
    input: 'js/comicgen.js',
    output: {
      file: 'dist/comicgen.min.js',
      format: 'umd',
      name: 'comicgen'
    },
    plugins: [
      terser()
    ]
  }
]
