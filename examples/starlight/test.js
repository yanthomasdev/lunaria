import { Lunaria } from '@lunariajs/core';

console.time('Lunaria benchmark');
const lunaria = new Lunaria();
const status = await lunaria.getFullStatus();
console.log(status);
console.timeEnd('Lunaria benchmark');
