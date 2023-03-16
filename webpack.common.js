const path = require('path');

module.exports = {
	entry: {
		content: './src/content/index.ts',
	},
	devtool: false,
	output: {
		path: path.resolve(__dirname, 'public'),
		filename: '[name].js',
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	plugins: [],
};
