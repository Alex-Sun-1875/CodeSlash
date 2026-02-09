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
		// 读取 tsconfig.json 中的路径配置
		const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
		let pathMappings = {};
		
		if (fs.existsSync(tsconfigPath)) {
			const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
			const paths = tsconfig.compilerOptions?.paths || {};
			
			// 转换路径映射
			for (const [alias, mappings] of Object.entries(paths)) {
				const normalizedAlias = alias.replace(/\*$/, '');
				const normalizedPath = mappings[0].replace(/\*$/, '');
				pathMappings[normalizedAlias] = normalizedPath;
			}
		}

		// 解析导入路径
		build.onResolve({ filter: /^@\/.*/ }, args => {
			const importPath = args.path;
			const alias = importPath.split('/')[1]; // 获取 @/ 后的第一部分
			
			if (pathMappings[alias]) {
				const resolvedPath = path.join(
					path.dirname(args.importer),
					pathMappings[alias],
					importPath.substring(alias.length + 2) // 移除 @/alias/ 部分
				);
				return { path: resolvedPath };
			}
			
			return { path: importPath };
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
