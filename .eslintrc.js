module.exports = {
	env: {
		browser: true,
		es2020: true
	},
	extends: "eslint:recommended",
	parserOptions: {
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