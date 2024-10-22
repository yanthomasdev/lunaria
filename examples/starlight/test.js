import { createLunaria } from '@lunariajs/core';

console.time('Lunaria benchmark');
const lunaria = await createLunaria({
	force: true,
	logLevel: 'debug',
});
const status = await lunaria.getFullStatus();
console.info(status);
console.timeEnd('Lunaria benchmark');
