import { createLunaria } from '@lunariajs/core';

console.time('Lunaria benchmark');
const lunaria = await createLunaria({
	force: true,
	logLevel: 'debug',
});
const status = await lunaria.getFileStatus('src/content/i18n/en.yml');
console.info(status.localizations[0].missingKeys);
console.timeEnd('Lunaria benchmark');
