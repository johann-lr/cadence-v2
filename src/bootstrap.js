/**
 * @author Johann Laur
 * @description Run before bot starts to check everything
 */

const { exec } = require("child_process");

exports.run = async () => {
	if (process.platform !== "linux" && process.platform !== "darwin") {
		console.log("[Boot] Please use a functional operating system!");
		process.exit(1);
	}
	if (Number(process.version.slice(1, 3)) < 11) {
		console.log(`[Boot] Optional update of node version (current: ${process.version})`);
	}
	await exec("ffmpeg -version", async (err, stdout) => {
		if (err) {
			console.log("[Boot] FFMPEG is not installed!");
			if (stdout.includes("bash: ffmpeg"))
				if (process.platform === "darwin") await exec("brew install ffmpeg");
				else exec("sudo apt install ffmpeg");
		} else console.log("[Boot] Finished safe-mode bootstrap script");
	});
};
