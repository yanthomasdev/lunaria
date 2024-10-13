import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { findLatestTrackedCommit } from '../../dist/status/git.js';

describe('Tracking', () => {
	it('should skip commits including ignored keywords', () => {
		const tracking = {
			ignoredKeywords: ['fix typo', 'lunaria-ignore'],
		};

		const commits = [
			{
				hash: 'hash1',
				date: '2021-09-01',
				message: 'fix typo in test.mdx',
				body: 'This is a test commit',
				refs: '',
				author_name: 'John Doe',
				author_email: 'john.doe@email.com',
			},
			{
				hash: 'hash2',
				date: '2021-08-01',
				message: '[lunaria-ignore] random moving',
				body: 'This is a test commit',
				refs: '',
				author_name: 'John Doe',
				author_email: 'john.doe@email.com',
			},
			{
				hash: 'hash3',
				date: '2021-07-01',
				message: 'latest valid change!',
				body: 'This is a test commit',
				refs: '',
				author_name: 'John Doe',
				author_email: 'john.doe@email.com',
			},
		];

		const latestTrackedCommit = findLatestTrackedCommit(
			tracking,
			'src/content/docs/en/test.mdx',
			commits,
		);

		assert.deepEqual(latestTrackedCommit, commits[2]);
	});

	it('should correctly evaluate `@lunaria-track` directive', () => {
		const tracking = {
			ignoredKeywords: ['fix typo', 'lunaria-ignore'],
		};

		const commits = [
			{
				hash: 'hash1',
				date: '2021-09-01',
				message: 'fix code in test.mdx',
				body: '@lunaria-track:src/content/docs/en/test.mdx;src/content/docs/en/test2.mdx;src/content/docs/en/(test3|glob-test).mdx',
				refs: '',
				author_name: 'John Doe',
				author_email: 'john.doe@email.com',
			},
			{
				hash: 'hash2',
				date: '2021-08-01',
				message: 'random moving',
				body: 'This is a test commit',
				refs: '',
				author_name: 'John Doe',
				author_email: 'john.doe@email.com',
			},
			{
				hash: 'hash3',
				date: '2021-07-01',
				message: 'some changes',
				body: 'This is a test commit',
				refs: '',
				author_name: 'John Doe',
				author_email: 'john.doe@email.com',
			},
		];

		const latestTrackedCommitOne = findLatestTrackedCommit(
			tracking,
			'src/content/docs/en/test.mdx',
			commits,
		);

		const latestTrackedCommitTwo = findLatestTrackedCommit(
			tracking,
			'src/content/docs/en/another-file.mdx',
			commits,
		);

		const latestTrackedCommitThree = findLatestTrackedCommit(
			tracking,
			'src/content/docs/en/test2.mdx',
			commits,
		);

		const latestTrackedCommitFour = findLatestTrackedCommit(
			tracking,
			'src/content/docs/en/glob-test.mdx',
			commits,
		);

		assert.deepEqual(latestTrackedCommitOne, commits[0]);
		assert.deepEqual(latestTrackedCommitTwo, commits[1]);
		assert.deepEqual(latestTrackedCommitThree, commits[0]);
		assert.deepEqual(latestTrackedCommitFour, commits[0]);
	});

	it('should correctly evaluate `@lunaria-ignore` directive', () => {
		const tracking = {
			ignoredKeywords: ['fix typo', 'lunaria-ignore'],
		};

		const commits = [
			{
				hash: 'hash1',
				date: '2021-09-01',
				message: 'fix code in test.mdx',
				body: '@lunaria-ignore:src/content/docs/en/test.mdx;src/content/docs/en/test2.mdx;src/content/docs/en/(test3|glob-test).mdx',
				refs: '',
				author_name: 'John Doe',
				author_email: 'john.doe@email.com',
			},
			{
				hash: 'hash2',
				date: '2021-08-01',
				message: 'random moving',
				body: 'This is a test commit',
				refs: '',
				author_name: 'John Doe',
				author_email: 'john.doe@email.com',
			},
			{
				hash: 'hash3',
				date: '2021-07-01',
				message: 'some changes',
				body: 'This is a test commit',
				refs: '',
				author_name: 'John Doe',
				author_email: 'john.doe@email.com',
			},
		];

		const latestTrackedCommitOne = findLatestTrackedCommit(
			tracking,
			'src/content/docs/en/test.mdx',
			commits,
		);

		const latestTrackedCommitTwo = findLatestTrackedCommit(
			tracking,
			'src/content/docs/en/another-file.mdx',
			commits,
		);

		const latestTrackedCommitThree = findLatestTrackedCommit(
			tracking,
			'src/content/docs/en/test2.mdx',
			commits,
		);

		const latestTrackedCommitFour = findLatestTrackedCommit(
			tracking,
			'src/content/docs/en/glob-test.mdx',
			commits,
		);

		assert.deepEqual(latestTrackedCommitOne, commits[1]);
		assert.deepEqual(latestTrackedCommitTwo, commits[0]);
		assert.deepEqual(latestTrackedCommitThree, commits[1]);
		assert.deepEqual(latestTrackedCommitFour, commits[1]);
	});
});
