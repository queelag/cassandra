const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

const Mode = {
  DEVELOPMENT: 'DEVELOPMENT',
  PRODUCTION: 'PRODUCTION'
}

const mode = process.env.MODE || Mode.DEVELOPMENT
const isDevelopment = mode === Mode.DEVELOPMENT
const isProduction = mode === Mode.PRODUCTION

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'umd'
  },
  mode: mode.toLowerCase(),
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts']
  },
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: { keep_fnames: true }
      })
    ]
  },
  externals: (context, request, callback) => (/^\.\.?/.test(request) ? callback() : callback(null, 'commonjs ' + request))
}
