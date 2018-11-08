const path = require('path')

module.exports = {
  mode: 'development',
  entry: path.join(__dirname, 'demo', 'demo.js'),
  output: {
    path: path.join(__dirname, 'demo'),
    filename: 'bundle.js'
  },
  plugins: [
  ]
}
