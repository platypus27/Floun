const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', // Set to 'production' for final builds
  entry: './src/index.tsx', // Entry point for your application
  output: {
    filename: 'popup.js', // Output file name
    path: path.resolve(__dirname, 'dist') // Output directory
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'] // Resolve these file extensions
  },
  devtool: 'inline-source-map', // Enable source maps for debugging
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
      },
      {
        test: /\.svg$/, // Handle SVG files (if needed)
        use: ['@svgr/webpack', 'file-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Path to your HTML template
      filename: 'index.html' // Output HTML file name
    })
  ],
  devServer: { // Optional: For development server
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  }
};