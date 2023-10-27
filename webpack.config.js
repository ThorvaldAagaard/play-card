const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
    entry: './src/app.ts', // Entry point for your application
    output: {
        filename: 'play-card.js', // Output file name
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
    module: {
        rules: [
            {
                test: /\.ts$/, // Handle TypeScript files
                use: 'ts-loader', // Use ts-loader for transpilation
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new CopyPlugin(
            {
                patterns: [
                    { from: 'models', to: 'models' }
                ]
            }
        )
        ],
    resolve: {
        extensions: ['.ts','.js'], // File extensions to resolve
    },
    mode: 'production',
};
