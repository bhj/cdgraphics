const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: path.join(__dirname, 'demo.js'),
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js'
  },
  plugins: [
  ]
}
