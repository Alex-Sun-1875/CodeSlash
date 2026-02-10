const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

/**
 * 路径别名解析插件
 * @type {import('esbuild').Plugin}
 */
const pathAliasPlugin = {
	name: 'path-alias',
	setup(build) {
		// 解析 @/ 开头的导入路径，映射到 src/ 目录
		build.onResolve({ filter: /^@\/.*/ }, async args => {
			const relativePath = args.path.replace(/^@\//, './');
			const result = await build.resolve(relativePath, {
				resolveDir: path.resolve(__dirname, 'src'),
				kind: 'import-statement',
			});
			if (result.errors.length > 0) {
				return { errors: result.errors };
			}
			return { path: result.path, external: result.external };
		});
	}
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
			pathAliasPlugin,
		],
	});
	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
