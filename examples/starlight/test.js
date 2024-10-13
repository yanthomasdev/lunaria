import { createLunaria } from '@lunariajs/core';

console.time('Lunaria benchmark');
const lunaria = await createLunaria();
const status = await lunaria.getFullStatus();
console.log(status);
console.timeEnd('Lunaria benchmark');
