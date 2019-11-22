/**
 * @description Checks if the bot is playing something (or is connected)
 * @param {Discord.Message} message
 * @returns {boolean}
 */
exports.isPlaying = message => {
	return message.guild.voiceConnection
		? message.guild.voiceConnection.dispatcher
			? true
			: false
		: false;
};

exports.isConnected = message => {
	return message.guild.voiceConnection ? true : false;
};
