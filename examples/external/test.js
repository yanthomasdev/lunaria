import { createLunaria } from '@lunariajs/core';

console.time('Lunaria benchmark');
const lunaria = await createLunaria({
	force: false,
	logLevel: 'debug',
});
const status = await lunaria.getFullStatus();
console.info(status.length);
console.timeEnd('Lunaria benchmark');
