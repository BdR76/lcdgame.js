module.exports = {
	env: {
		browser: true,
		es2020: true
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint',
	],
	parserOptions: {
		project: "./tsconfig.json",
		sourceType: "module"
	},
	rules: {
		indent: ["error", "tab", {
			SwitchCase: 1
		}],
		"no-unused-vars": "warn",
		semi: ["error", "always"]
	}
};