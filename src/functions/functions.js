/**
 * @author Johann Laur, anidiotsguide
 * @module functions.js
 * @description Module which includes some usefule methods, mostly attached to the dc client
 * @param client discord client
 */

const fs = require("fs"),
	lodash = require("lodash");

module.exports = client => {
	/**
	 * @param value original string where placeholders should be replaced
	 * @param data all optional, data for placeholder
	 * @returns {string} with all injected data
	 */
	client.languageReplace = (
		value,
		data = null,
		data2 = null,
		data3 = null,
		data4 = null,
		data5 = null,
		data6 = null,
		data7 = null
	) => {
		var langstring = value.replace("{$1}", data);
		langstring = langstring.replace("{$2}", data2);
		langstring = langstring.replace("{$3}", data3);
		langstring = langstring.replace("{$4}", data4);
		langstring = langstring.replace("{$5}", data5);
		langstring = langstring.replace("{$6}", data6);
		langstring = langstring.replace("{$7}", data7);
		return langstring;
	};

	/**
	 * @description local function that appends lines to logfiles
	 * @param {String} file name of file, without any filesuffix
	 * @param {String} log content that should be logged and saved
	 */
	function writeLog(file, log) {
		fs.appendFile(`logs/${file}.log`, `[${new Date()}] ${log}\n`, err => {
			if (err) throw err;
		});
	}

	/**
	 * @description Log function to organize console.log stuff
	 * @param type type of log f.ex. error
	 * @param msg message that is displayed
	 * @param title optional title of log message
	 */
	client.log = (type, title, msg) => {
		if (!title || title == "") title = "Log";
		const content = `[${type}] [${title}] ${msg}`;
		console.log(content);
		if (process.argv.indexOf("-w") !== -1)
			switch (type) {
				case "Player":
					if (title === "Log") writeLog("player", content);
					else writeLog("player_debug", content);
					break;
				case "Error":
					writeLog("errors", content);
					break;
				case "Dashboard":
					writeLog("dashboard", content);
					break;
				default:
					writeLog("info", content);
			}
	};

	/**
	 * @description Remove streams from queue to stringify it
	 * @param {Array} queue queue for specific guild
	 * @returns queue where only keys per object are title, link and requester
	 */
	client.getClearQueue = queue => {
		return lodash.map(queue, obj => {
			return lodash.pick(obj, ["link", "title", "req", "reqTag"]);
		});
	};

	/*
  SINGLE-LINE AWAITMESSAGE

  A simple way to grab a single reply, from the user that initiated
  the command. Useful to get "precisions" on certain things...

  USAGE

  const response = await client.awaitReply(msg, "Favourite Color?");
  msg.reply(`Oh, I really love ${response} too!`);

  */
	client.awaitReply = async (msg, question, limit = 60000) => {
		const filter = m => (m.author.id = msg.author.id);
		await msg.channel.send(question);
		try {
			const collected = await msg.channel.awaitMessages(filter, {
				max: 1,
				time: limit,
				errors: ["time"]
			});
			return collected.first().content;
		} catch (e) {
			return false;
		}
	};

	/* MISCELANEOUS NON-CRITICAL FUNCTIONS */

	// EXTENDING NATIVE TYPES IS BAD PRACTICE. Why? Because if JavaScript adds this
	// later, this conflicts with native code. Also, if some other lib you use does
	// this, a conflict also occurs. KNOWING THIS however, the following 2 methods
	// are, we feel, very useful in code.

	// <String>.toCamelCase() returns a proper-cased string such as:
	// "Mary had a little lamb".toCamelCase() returns "Mary Had A Little Lamb"
	String.prototype.toCamelCase = function() {
		return this.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	};

	// <Array>.random() returns a single random element from an array
	// [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
	Array.prototype.random = function() {
		return this[Math.floor(Math.random() * this.length)];
	};

	// `await client.wait(1000);` to "pause" for 1 second.
	client.wait = require("util").promisify(setTimeout);

	// These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
	process.on("uncaughtException", err => {
		const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
		client.log("Error", "Uncaught Exception", errorMsg);
		client.log("Info", "Restart", "Process will exit due to an uncaught exception");
		// Always best practice to let the code crash on uncaught exceptions.
		// Because you should be catching them anyway.
		process.exit(1);
	});

	process.on("unhandledRejection", err => {
		client.log("Error", "Uncaught Promise Error", err);
		console.log(err);
	});
};
