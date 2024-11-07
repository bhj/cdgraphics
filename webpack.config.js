import path from 'path'

export default {
  mode: 'development',
  entry: path.join(import.meta.dirname, 'demo', 'demo.js'),
  output: {
    path: path.join(import.meta.dirname, 'demo'),
    filename: 'bundle.js'
  },
  plugins: [
  ]
}
