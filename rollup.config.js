import { uglify } from 'rollup-plugin-uglify'

export default [
  {
    input: 'js/comicgen.js',
    output: {
      file: 'dist/comicgen.min.js',
      format: 'umd',
      name: 'comicgen'
    },
    plugins: [
      uglify()
    ]
  }
]
