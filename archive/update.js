/**
 * @author Johann Laur
 * @version 1.0
 * @description Update code from github master branch
 * @warning pls dont use, currently broken
 */

// allows executing commands to cl and get stdout
const { exec } = require("child_process"),
  packageJSON = require("../../package.json"),
  fs = require("fs"),
  configPath =
    process.platform === "linux" ? "../../config/config.json" : "../../config/dev_conf.json",
  config = require(configPath);

/**
 * @param client discord client
 * @param {String} trigger of the function f.ex. dashboard, discord, webhook
 * @param {Discord.TextChannel} channel optional, log channel/of update command
 */
exports.update = async (client, trigger, channel) => {
  client.log("Info", "Updater", "Update called");
  client.log("Info", "Updater", `Triggered by ${trigger}`);
  client.log("Info", "Current Version", packageJSON.version);
  // send current version to channel if channel param was passed
  if (channel) channel.send(`Current version: \`${packageJSON.version}\`\nChecking for updates...`);
  client.log("Info", "Updater", "Checking for changes on github origin");
  // set client to "update state"
  client.user.setStatus("dnd");
  client.user.setActivity("Updating...");
  client.log("Info", "Updater", "Creating Backup");
  // make directory and copy complete stuff into it as a backup
  await exec("mkdir backup");
  await exec("cp -R ./ backup");
  // rename config so that configs are not overwritten by git
  exec("mv config configBCKP", err => {
    if (err) console.log("Error", "Updater Error", `Renaming /config - configBCK failed: ${err}`);
    // update branches
    exec("git remote update", async err => {
      if (err) throw err;
      // set reset --hard so changed files will be overwritten
      // otherwise they'd throw merge errors and process will fail
      await exec("git reset --hard origin/master");
      // pull master from origin
      exec("git pull origin master", async (err, stdout) => {
        if (err) console.log("Error", "Updater Error", err);
        client.log("Info", "Updater", stdout);
        // change name of config from origin
        await exec("mv config configOrigin");
        // rename original config dir
        exec("mv configBCKP config", err => {
          if (err) console.log("Error", "Updater Error", `Renaming /config failed: ${err}`);
          config["lastUpdated"] = new Date();
          fs.writeFile(configPath, JSON.stringify(config), err =>
            client.log("Error", "fs writefile", err)
          );
        });
      });
    });
  });
  if (channel) channel.send(`Updated to **${packageJSON.version}**\nRestarting now...`);
  client.log("Info", "", "Restarting Now");
  // destroy client to make it restart
  client.destroy();
};
