import getPort from 'get-port';
import { existsSync, readFileSync } from 'node:fs';
import http from 'node:http';
import { join, resolve } from 'node:path';
import { loadConfig } from '../../config/index.js';
import { bold, highlight, preview as p } from '../console.js';
import type { PreviewOptions } from '../types.js';

export async function preview(options: PreviewOptions) {
	const configPath = options.config ?? './lunaria.config.json';
	const serverPort = await getPort({ port: options.port ? parseInt(options.port) : 3000 });

	const { userConfig } = await loadConfig(configPath);

	const outDir = resolve(userConfig.outDir);
	const dashboardPath = join(outDir, 'index.html');

	if (!existsSync(dashboardPath)) {
		console.log(p(`Could not find a build to preview at ${highlight(dashboardPath)}`));
		process.exit(0);
	}

	http
		.createServer((_, res) => {
			const dashboardFile = readFileSync(dashboardPath);

			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(dashboardFile, 'binary');
			res.end();
		})
		.listen(serverPort);

	console.log(p(`Server open on ${highlight(`http://localhost:${serverPort.toString()}/`)}`));
	console.log(p(`Press ${bold('CNTRL + C')} to close it.`));
}
