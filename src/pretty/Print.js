/*!
 * Pretty
 * Pretty print to the console
 * (c) 2018-2019 Verdexdesign
 */

const { getRandomInt, readOnlyKeys } = require('../Utils');

// Addons with more functions for this module
const ADDONS = {
	// A flag for quiet mode; default: false
	quiet: false,
	noColor: false,
	labelWColors: '',
	plainLabel: ''
};

/**
 * ANSI colors defines by their foreground and background codes
 * @property {object} fg - Foreground color codes for the Terminal
 * @property {object} bg - Background color codes for the Terminal
 * @property {string} reset - Terminal color reset code
 */
const COLOR_CODES = {
	black: [30, 40],
	'bright-green': [92, 102],
	yellow: [33, 43],
	white: [37, 47],
	blue: [34, 44],
	green: [32, 42],
	red: [31, 39],
	gray: [90, 39],
	reset: 0
};

/**
 * Creates a complete ANSI color from color codes by defining the color as an object
 * with fg and bg for foreground and background recpectively.
 * Except for special cases such as reset.
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code | ANSI escape code}
 * @param {string} color The color to build
 */
function Color(color) {
	// {} | number
	const full = COLOR_CODES[color] && COLOR_CODES[color].length || {};
	return (full === 2)
		? {
			fg: `\u001b[${COLOR_CODES[color][0]};`,
			bg: `${COLOR_CODES[color][1]}m`,
			nobg: `\u001b[${COLOR_CODES[color][0]}m`
		}
		: full;
}

// Extend for special cases
Color.reset = `\u001b[${COLOR_CODES.reset}m`;

// Helpers

/**
 * writes a message to the console using ANSI colors
 * @param {string} msg The message to write
 * @param {string} colors The foreground and the background colors separated by a "."
 * @param {string} label A label to write before the message
 * @param {string} type The console method to use
 * @param {number} displayFreq How frequently should messages be displayed;
 * Range 0-5, from display always to less often; default: 0
 */
function Pretty(msg, colors = 'white.black', label = '', type = 'log', displayFreq = 0) {
	// get foreground and background colors
	const [asFG, asBG] = colors.split('.');
	// get correct colors with fg and bg or only fg
	const fore = Color(asFG).fg || Color(asFG).nobg || ' ';
	const back = Color(asBG).bg || Color.reset;

	// random number to compare to 'displayFreq'
	// a smaller number of course will hit more often than a larger number
	// so lets set a cut-off at 5, were the frequency of printing will be a satisfiable small amount
	const rand = displayFreq <= 5 ? getRandomInt(0, displayFreq + 1) : 0;

	// verify if it can print message
	const canDisplay = rand === displayFreq && !ADDONS.quiet;

	// verify if can print with colors
	const wColors = !ADDONS.noColor;

	const hasColors = wColors && Color(asFG) && Color(asBG);

	switch (true) {
	case hasColors && label.length && canDisplay:
		console[type]('%s %s%s%s %s', label, fore, back, msg, Color.reset);
		break;
	case hasColors && !label.length && canDisplay:
		console[type]('%s%s%s %s', fore, back, msg, Color.reset);
		break;
	case !hasColors && !wColors || label.length && canDisplay:
		console[type]('%s %s %s', ADDONS.plainLabel, msg, Color.reset);
		break;
	}
}

/**
 * Scans user input and passes it to the callback
 * @param {string} msg The message to print
 * @param {string} opts Options for answers; default: '(y/n)'
 * @param {function} cb A callback
 */
function Scan(msg, opts, cb) {
	// resume the standard input to take inputs
	process.stdin.resume();
	// print the question
	process.stdout.write(`${msg} ${opts}? `);
	// read input and pass it to the callback
	process.stdin.on('data', data => {
		cb(data);
	});
}

// Interface

/**
 * Print to the terminal with colors
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code | ANSI escape code}
 * @param {object} opts Print options
 */
const Print = opts => {
	let { displayFrequency, labels } = opts;
	// How frequently should certain messages be displayed; Range 0-5, from always to less often
	displayFrequency = displayFrequency || { tip: 5, info: 2 };
	// labels for messages
	labels = labels || { error: 'err!', tip: 'tip!', success: 'success!', info: 'info:' };
	// message can be read as an array of strings, join the data with spaces
	const join = msg => msg.join('');

	return {
		/**
		 * writes an error message
		 * @param {string[]} msg The message to write
		 */
		error: (...msg) => {
			Pretty(`${labels.error || 'err!'}${Color.reset} ${join(msg)}`, 'red.black', ADDONS.labelWColors, 'error');
		},
		/**
		 * pretty tip
		 * @param {string[]} msg The message to write
		 */
		tip: (...msg) => {
			Pretty(`${labels.tip || 'tip!'}${Color.reset} ${join(msg)}`, 'green.black', ADDONS.labelWColors, 'log', displayFrequency.tip);
		},
		/**
		 * pretty success message
		 * @param {string[]} msg The message to write
		 */
		success: (...msg) => {
			Pretty(`${labels.success || 'success!'}${Color.reset} ${join(msg)}`, 'black.green', ADDONS.labelWColors);
		},
		/**
		 * pretty info
		 * @param {string[]} msg The message to write
		 */
		info: (...msg) => {
			Pretty(`${labels.info || 'info:'}${Color.reset} ${join(msg)}`, 'blue.black', ADDONS.labelWColors, 'info', displayFrequency.info);
		},
		/**
		 * pretty log
		 * @param {string} msg The message to write
		 * @param {string} colors The foreground and the background colors separated by a "."
		 * or just a color. Example: 'blue.black' or 'green'
		 */
		log: (msg, colors = '') => {
			Pretty(msg, colors, ADDONS.labelWColors);
		},
		/**
		 * pretty question
		 * @param {string} msg The message to write
		 * @param {function} cb A callback function
		 * @param {string} yn Options for answers; default: '(y/n)'
		 */
		ask: (msg, cb, yn = '(y/n)') => {
			!ADDONS.noColor && process.stdout.write(`${ADDONS.labelWColors} ${Color.reset}`);
			Scan(msg, yn, ans => {
				cb(ans.toString().trim());
			});
		},
		/**
		 * Extends this module with additional functionalities
		 * @param {string} k The addon; list of addons: ['quiet']
		 * @param {string} v The value for the addon
		 */
		extend: (k, v) => {
			if (Object.keys(ADDONS).includes(k)) {
				ADDONS[k] = v;
				return true;
			}
			return false;
		},
		/**
		 * Defines a label with colors to prefix Print messages with
		 * @param {string} cmdlabel The label used as prefix for messages
		 * @param {string} colors Print colors for the label
		 * @param {number} padLabel Number of spaces to pad the label with
		 */
		setPrettyLabel: (cmdlabel, colors, padLabel = 0) => {
			// get foreground and background colors
			const [asFG, asBG] = colors.split('.');
			// get correct colors with fg and bg or only fg
			const fore = Color(asFG).fg || Color(asFG).nobg || '';
			const back = Color(asBG).bg || Color.reset;
			// create the label with colors and possible padding
			const labelWColors = fore
			+ back
			+ String().padStart(padLabel)
			+ String(cmdlabel)
			+ String().padEnd(padLabel)
			+ Color.reset;
			ADDONS.labelWColors = labelWColors;
			ADDONS.plainLabel = cmdlabel;
		}
	};
};

// Export default

module.exports = Print;

// Export extras

module.exports.pretty = Pretty;
module.exports.scan = Scan;
module.exports.addons = ADDONS;

/**
 * Print color codes
 */
module.exports.color = Color;

// Turn keys in module.exports to read only

readOnlyKeys(module.exports);
