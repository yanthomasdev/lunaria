import { createTracker } from '@tracker-thing/core';

const tracker = createTracker({
	repository: 'https://github.com/Yan-Thomas/tracker-thing',
	defaultLocale: {
		label: 'English',
		lang: 'en',
		contentLocation: "./**/*.md"
	},
});

console.log("Run successfully!");
