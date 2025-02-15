const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx', // Entry point for your React app
  output: {
    filename: 'popup.js', // Output file name
    path: path.resolve(__dirname, 'build') // Output directory
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'] // Resolve these file extensions
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Handle .ts and .tsx files
        use: 'ts-loader', // Use ts-loader for TypeScript
        exclude: /node_modules/
      },
      {
        test: /\.css$/, // Handle CSS files
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Path to your HTML template
      filename: 'index.html' // Output HTML file name
    })
  ]
};