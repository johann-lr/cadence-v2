/**
 * @description EventEmitter that handles the dispatchers and executes play function
 * @exports EventEmitter
 */

const EventEmitter = require("events");

const playEmitter = new EventEmitter();

module.exports = playEmitter;
