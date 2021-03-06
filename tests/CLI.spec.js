const { describe, it } = require('mocha');
const { expect } = require('chai');

const fs = require('fs');
const execute = require('util').promisify(require('child_process').execFile);

const { execOptions } = require('../src/Globals');

describe('makever cli tests', () => {
	const testDir = 'tests/.tmp';
	const customDir = `${testDir}/out/file.json`;
	const command = 'src/CLI.js';
	const log = console.log;

	it('should show help', async function() {
		const { stdout, stderr } = await execute(command, ['-h'], execOptions);
		expect(stderr).to.be.empty;
		expect(stdout).to.not.be.empty;
		// verify sections on the help panel
		expect(stdout).to
			.include('Basic')
			.include('Output')
			.include('Misc');
	});

	it('should dump version data to standard out', async function() {
		// force to bypass any existing version file
		const { stdout, stderr } = await execute(command, ['--std', '-f'], execOptions);
		expect(stderr).to.be.empty;
		expect(stdout).to.not.be.empty;
		// verify certain keys in the version data
		expect(stdout).to
			.include('codename')
			.include('branch')
			.include('full')
			.include('raw')
			.include('major')
			.include('minor')
			.include('patch');
	});

	it('should dump version data to stdout with custom codename', async function() {
		// force to bypass any existing version file
		const { stdout, stderr } = await execute(command, ['--std', '-c', 'testeros', '-f'], execOptions);
		expect(stderr).to.be.empty;
		expect(stdout).to.not.be.empty;
		// verify certain keys in the version data
		expect(stdout).to.include('testeros');
		log(stdout);
	});

	it('should throw error if combined --std and -o for custom output path', async function() {
		try {
			const { stderr } = await execute(command, ['--std', '-o', `${customDir}`, '-f'], execOptions);
			expect(stderr).to.not.be.empty;
		} catch (err) {
			expect(err.stderr).to.include('Invalid operation: cannot combine "--std" and "-o"');
		}
	});

	it('should write a version file on a custom path', async function() {
		const { stdout, stderr } = await execute(command, ['-c', 'Testeros', '-o', `${customDir}`, '-f'], execOptions);
		expect(stderr).to.be.empty;
		expect(stdout).to.not.be.empty;
		// verify contents
		expect(fs.existsSync(customDir)).to.be.true;
		const versionFile = JSON.parse(fs.readFileSync(customDir));
		expect(versionFile.codename).to.equal('Testeros');
		expect(versionFile).to.contain.keys(['codename', 'branch', 'full', 'major', 'minor', 'patch', 'raw']);
	});

	it('should test tagging the repo (use -f to bypass a repo with current changes and -n to not actually tag)',
		async function() {
			const { stdout, stderr } = await execute(command, ['--tag', '-m', 'Codename %c Version %v', '-f', '-n'], execOptions);
			expect(stderr).to.be.empty;
			expect(stdout).to.not.be.empty;
			log(stdout);
		});
});
