const fs = require("fs");

exports.run = async (client, message) => {
	fs.readdir("./logs", (err, files) => {
		if (err) return client.log("Error", "fs readdir", err);
		files.forEach(file => {
			// only for log files
			if (!file.endsWith(".log")) return;
			// set content to nothing
			fs.writeFile(`./logs/${file}`, "", err => {
				if (err) client.log("Error", "fs writeFile", err);
			});
		});
	});
	client.log("Info", "", "Cleared log files");
	message.react("✅");
};

exports.config = {
	requiresAdmin: true,
	requiresArg: false,
	enabled: true,
	alias: []
};
