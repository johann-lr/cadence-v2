/* eslint-disable */
/**
 * @author Johann Laur
 * @description Musicbot Cadence#0862
 * @module index.js Main file of bot
 * @version 1.1.1
 * @index
 * @deprecated
 */

// packages
const Discord = require("discord.js"),
  fs = require("fs"),
  moment = require("moment"),
  ytdl = require("ytdl-core"),
  search = require("youtube-search"),
  ytpl = require("ytpl"),
  spotify = require("spotify-url-info"),
  request = require("request"),
  packageJSON = require("../package.json");
require("moment-duration-format");

const client = new Discord.Client();
require("./clientConnectionEvents")(client);
require("./functions/functions")(client); // additional client functions

client.log("Info", `Running version ${packageJSON.version}`, `on ${process.platform}`);
if (process.argv[3] === "-s" || process.argv[2] === "-s") {
  const boot = require("./bootstrap");
  boot.run();
}

// Client rich embeds
const clientEmbeds = require("./client_embeds"),
  messageStrings = {
    de: require("../config/languages/de.json"),
    en: require("../config/languages/en.json")
  },
  langSets = require("../config/guild_langs.json"),
  colorSets = require("../config/guild_colors.json"),
  prefixSets = require("../config/guild_prefix.json"),
  channels = require("../config/main_channels.json"),
  npConfig = require("../config/npmsg_config.json"),
  { filterResults } = require("./functions/filter_results"),
  { dmHandler } = require("./functions/dm"),
  { update } = require("./functions/update");

/////////////////////////////////////////////////
// BASIC CONFIGURATIONS
/////////////////////////////////////////////////

// all that is neccescary for the music and it's configuration
client.queue = {};
let played = {},
  musicConfig = {
    loop: {},
    loopAll: {},
    autoVolume: {},
    loopIndex: {},
    autop: {}
  },
  // object that will save the id of the last "Now-playing-message" on a guild
  // to replace it later or delete it
  lastNPMessage = {};

// Get config depending on platform of process
client.config =
  process.platform === "linux"
    ? require("../config/config.json")
    : require("../config/dev_conf.json");

// youtube-search options
const opts = {
    maxResults: 5,
    key: client.config.yt.key
  },
  addOpts = {
    maxResults: 5,
    key: client.config.yt.key2
  };

/////////////////////////////////////////////////
// GENERAL FUNCTIONS
/////////////////////////////////////////////////

/**
 * @description Edit a guild's language set (json file)
 * @param {String} guildID discord guild id
 * @param {String} language Two character language string
 */
function updateGuildLang(guildID, language) {
  langSets[guildID] = language;
  fs.writeFile("./config/guild_langs.json", JSON.stringify(langSets), err => {
    if (err) throw err;
  });
}

/**
 * @description Send Message to bot owner when bot leaves/joins a guild
 * @param {Boolean} join whether it joined or not
 * @param {GuildCollection} guild the discord guild
 */
function notifyOwner(join, guild) {
  let creator = client.users.get(client.config.jhn);
  let msg = join ? `Ich bin **${guild}** beigetreten` : `Ich habe **${guild}** verlassen`;
  creator.send(msg);
}

/**
 * @description Edit guild configuration for last np message
 * @param {String} guildID discord guild id
 * @param {String} setting dl, stay, default
 * @param {Discord.Message} message the sent message to react on
 */
function writeNPMSGConfig(guildID, setting, message) {
  npConfig[guildID] = setting;
  fs.writeFile("./config/npmsg_config.json", JSON.stringify(npConfig), err => {
    if (err) throw err;
  });
  message.react("✅");
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////

// message event
client.on("message", async message => {
  if (message.author.bot) return;
  // Send a dm directly to JHN#9045
  if (message.channel.type === "dm") return dmHandler(client, message);
  // always that basic command handler...
  const msgGuildID = message.guild.id;
  const guildStrings = messageStrings[langSets[msgGuildID]];
  const prefix = (await prefixSets[msgGuildID]) ? prefixSets[msgGuildID] : client.config.prefix;
  const guildTheme = colorSets[msgGuildID] ? colorSets[msgGuildID] : client.config.colors.blue;

  /////////////////////////////////////////////////
  // FUNCTIONS
  /////////////////////////////////////////////////

  async function sendInfoMessage() {
    await message.channel.startTyping();
    let pref = prefixSets[msgGuildID] ? prefixSets[msgGuildID] : client.config.prefix;
    let info = new Discord.RichEmbed()
      .setColor(guildTheme)
      .setTitle(guildStrings.infoHead)
      .setDescription(
        `Basics: ${pref}play, ${pref}next, ${pref}volume\n[Bot Homepage](https://musicbot.ga/commands)`
      )
      .setAuthor(client.user.username, client.user.avatarURL)
      .setFooter(`${guildStrings.infoFooter} https://musicbot.ga/bot`);
    await message.channel.send(info);
    message.channel.stopTyping();
  }

  // react on mentions with tiny info message
  if (message.isMentioned(client.user)) return sendInfoMessage();
  if (message.content.indexOf(prefix) !== 0) return;
  const args = message.content
    .slice(client.config.prefix.length)
    .trim()
    .split(/ +/g);
  let command = args.shift().toLowerCase();

  /**
   * @description Checks if the bot is playing something
   * @returns {boolean}
   */
  function isPlaying() {
    if (message.guild.voiceConnection) {
      if (message.guild.voiceConnection.dispatcher) return true;
    } else return false;
  }

  // important rich embeds
  let noPlaying = new Discord.RichEmbed()
    .setColor(guildTheme)
    .setDescription(guildStrings.noPlaying);
  let noArgs = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.noArgs);

  /**
   * @description Skip song by ending stream dispatcher
   */
  async function nextSong() {
    if (!isPlaying()) return message.channel.send(noPlaying);
    let skipped = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.skipped);
    await message.channel.send(skipped);
    message.guild.voiceConnection.dispatcher.end();
  }

  /**
   * @description Pauses the stream dispatcher and adds pause reaction to msg
   */
  function pauseDispatcher() {
    if (!isPlaying()) return message.channel.send(noPlaying);
    message.react("⏸");
    message.guild.voiceConnection.dispatcher.pause();
  }

  /**
   * @description Leave a voicechannel if it is empty
   */
  function leaveEmptyChannel() {
    delete musicConfig.loopAll[msgGuildID];
    delete musicConfig.volume[msgGuildID];
    client.queue[msgGuildID] = [];
    message.guild.voiceConnection.disconnect();
    let disc = new Discord.RichEmbed()
      .setColor(guildTheme)
      .setDescription(guildStrings.disconnectVC);
    message.channel.send(disc);
  }

  /**
   * @description Change volume of dispatcher
   */
  async function changeVolume() {
    if (!isPlaying()) return message.channel.send(noPlaying);
    if (!args[0]) {
      let currentVolume = new Discord.RichEmbed()
        .setColor(guildTheme)
        .setDescription(
          `${guildStrings.volume} ${message.guild.voiceConnection.dispatcher.volume * 100}%`
        );
      message.channel.send(currentVolume);
      return;
    }
    let volumeErr = new Discord.RichEmbed()
      .setDescription(guildStrings.volumeExe)
      .setColor(guildTheme);
    if (args[0] < 0) return message.channel.send(volumeErr);
    let msg = new Discord.RichEmbed().setColor(guildTheme);
    if (args[0] === "reset" || args[0] === "r") {
      message.guild.voiceConnection.dispatcher.setVolume(1);
      msg.setColor(guildTheme).setDescription(guildStrings.volumeReset);
      message.channel.send(msg);
      return;
    }
    if (isNaN(args[0])) {
      msg.setDescription(guildStrings.isNAN);
      return message.channel.send(msg);
    }
    if (args[0] > 200) message.channel.send(volumeErr);
    msg.setDescription(client.languageReplace(guildStrings.volumeChange, `${args[0]}%`));
    message.guild.voiceConnection.dispatcher.setVolume(args[0] / 100);
    message.channel.send(msg);
  }

  /**
   * @description Connects the bot client to voicechannel
   * @returns Message to dc text channel
   */
  function connectVC() {
    let errMsg = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.noVC);
    if (!message.member.voiceChannel) return message.channel.send(errMsg);
    let channel = message.member.voiceChannel;
    if (!channel.permissionsFor(client.user).has("CONNECT")) {
      errMsg.setDescription(guildStrings.connectErr);
      return message.channel.send(errMsg);
    }
    if (!channel.permissionsFor(client.user).has("VIEW_CHANNEL")) {
      errMsg.setDescription(guildStrings.missingPerm);
      return message.channel.send(errMsg);
    }
    if (!channel.permissionsFor(client.user).has("SPEAK")) {
      errMsg.setDescription(guildStrings.speakErr);
      return message.channel.send(errMsg);
    }
    message.member.voiceChannel.join();
    errMsg.setDescription(guildStrings.joined);
    message.channel.send(errMsg);
  }

  /**
   * @description Disconnects from vc and deletes music configs for guild if necescary
   */
  function leaveVC() {
    let msg = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.noVC);
    if (!message.guild.voiceConnection || !message.member.voiceChannel)
      return message.channel.send(msg);
    if (isPlaying()) {
      //musicConfig.loop.splice(musicConfig.loop.indexOf(message.guild.id), );
      delete musicConfig.loopAll[msgGuildID];
      message.guild.volume = 1;
    }
    client.queue[msgGuildID] = [];
    message.guild.voiceConnection.dispatcher.end();
    message.guild.voiceConnection.disconnect();
    msg.setDescription(guildStrings.disconnectVC);
    message.channel.send(msg);
  }

  /**
   * @description create different dispatcher and play too perfect (mp3) because it is unavailable on yt
   */
  function playTooPerfect() {
    if (!message.member.voiceChannel) return message.channel.send(":x: Nope");
    message.member.voiceChannel.join().then(c => {
      let dp = c.playFile("./audio/TooPerfect.mp3", {
        bitrate: "auto"
      });
      dp.on("start", () => message.channel.send("Tooo perfect ^^"));
      dp.on("end", () => message.member.voiceChannel.leave());
    });
  }

  /**
   * @description Remove song from queue array by getting the index or searching for the title
   */
  async function removeFromQueue() {
    if (!args[0]) return message.channel.send(noArgs);
    if (!isNaN(args[0])) {
      let msg = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.noQ);
      if (args[0] == 0 || args[0] > client.queue[msgGuildID].length)
        return message.channel.send(msg);
      else {
        let removed = await new Discord.RichEmbed()
          .setDescription(
            `:x: **${client.queue[msgGuildID][Number(args[0])].title}**\n${message.member}`
          )
          .setColor(guildTheme);
        client.queue[msgGuildID].splice(Number(args[0]), Number(args[0]));
        message.channel.send(removed);
      }
    } else {
      let search = args.join(" ").toLowerCase();
      let titles = client.queue[msgGuildID].map(t => t.title.toLowerCase());
      let includes = title => {
        return title.includes(search);
      };
      let index = titles.findIndex(includes);
      let removed = await new Discord.RichEmbed()
        .setColor(guildTheme)
        .setDescription(`:x: **${client.queue[msgGuildID][index].title}**\n${message.member}`);
      client.queue[msgGuildID].splice(index, index);
      message.channel.send(removed);
    }
  }

  /**
   * @description Play function that gets the stream and plays it into a voicechannel
   * @param {ReadableStream, String} song stream from queue (instead of stream link)
   * @param {string} link yt stream link (used to get additional infos)
   */
  async function play(song, link) {
    var downlID = {};
    var playing; // will become rich embed
    if (!message.guild.voiceConnection) connectVC();
    let vc = message.guild.voiceConnection;
    client.log("Player", "", `Connected to #${vc.channel.name} (${vc.channel.id})`);
    if (!client.queue[msgGuildID]) client.queue[msgGuildID] = [];
    // only done if loop is not activated to prevent spamming
    if (typeof song == "string") {
      let download = new Discord.RichEmbed()
        .setColor(guildTheme)
        .setDescription(guildStrings.download);
      await message.channel.send(download).then(m => (downlID[msgGuildID] = m.id));
    }

    const dispatcher =
      typeof song != "string"
        ? vc.playStream(song)
        : vc.playStream(ytdl(song, { filter: "audioonly" }));

    dispatcher.on("start", () => {
      client.log(
        "Player",
        "",
        `Started Playing ${client.queue[msgGuildID][0].title} (${msgGuildID})`
      );
      // set dispatcher volume to saved value if it exists
      if (message.guild.volume) dispatcher.setVolume(message.guild.volume);
      // set stream bitrate depending on channel bitrate
      dispatcher.setBitrate("auto");

      if (!client.queue[msgGuildID][0].stream)
        client.queue[msgGuildID][0].stream = ytdl(client.queue[msgGuildID][0].link, {
          filter: "audioonly"
        });

      if (channels[msgGuildID]) {
        if (
          message.guild.me.hasPermission("MANAGE_CHANNELS") ||
          message.channel.memberPermissions(message.guild.me).has("MANAGE_CHANNELS")
        ) {
          let channel = client.channels.get(channels[msgGuildID]);
          channel.setTopic(
            `:arrow_forward: ${guildStrings.np}: ${client.queue[msgGuildID][0].title}`
          );
        }
      }
      ytdl.getInfo(link, (err, info) => {
        if (err) throw err;
        // only without looping enabled
        if (!musicConfig.loop[msgGuildID]) {
          var secsRest = info.length_seconds % 60;
          var minutes = (info.length_seconds - secsRest) / 60;
          if (secsRest < 10) secsRest = `0${secsRest}`;
          playing = new Discord.RichEmbed().setTitle(guildStrings.np).setColor(guildTheme);
          if (client.queue[msgGuildID][0].spotify)
            playing.setThumbnail(client.queue[msgGuildID][0].spotify);
          else playing.setThumbnail(info.thumbnail_url);
          if (info.media.song && info.media.artist) {
            playing.addField(guildStrings.songtitle, info.media.song);
            playing.addField(guildStrings.artist, info.media.artist);
          } else {
            playing.addField(guildStrings.songtitle, info.title);
            playing.addField("Video Uploader", info.author.name);
          }
          playing.addField(guildStrings.length, `\`${minutes}:${secsRest}min\``, true);
          playing.addField(guildStrings.req, `<@!${client.queue[msgGuildID][0].req}>`, true);
          if (downlID[msgGuildID]) {
            message.channel.messages
              .get(downlID[msgGuildID])
              .edit(playing)
              .then(m => {
                lastNPMessage[msgGuildID] = m.id;
              });
            delete downlID[msgGuildID];
          } else message.channel.send(playing).then(m => (lastNPMessage[msgGuildID] = m.id));
        }
      });
    });
    dispatcher.on("error", err => client.log("Player", "Dispatcher Error", err));

    //event volumeChange to save changed volume in playFile (so next tracks will keep that volume)
    dispatcher.on("volumeChange", (old, newVolume) => {
      message.guild.volume = newVolume;
      client.log("Player", "", `${msgGuildID}: Saved updated volume (${newVolume})`);
    });
    dispatcher.on("debug", info => {
      client.log("Player", "Dispatcher Debug", info);
      client.channels
        .get(client.config.channels.log)
        .send(`Stream Dispatcher Debugging Info: ${info}`);
    });
    dispatcher.on("end", async () => {
      // first check if played-array exists in object
      if (!played[msgGuildID]) played[msgGuildID] = [];
      // leave voicechannel and stop if the channel is empty except from bot
      if (message.guild.voiceConnection.channel.members.map(m => m.id).length < 2)
        return leaveEmptyChannel();

      // continue looping through queue if loop all is activated
      if (musicConfig.loopAll[msgGuildID]) {
        let nLink = client.queue[msgGuildID][musicConfig.loopIndex[msgGuildID]].link;

        if (musicConfig.loopIndex[msgGuildID] + 1 == client.queue[msgGuildID].length)
          musicConfig.loopIndex[msgGuildID] = 0; // set loopIndex back to 0 if the complete queue was played to start again
        if (client.queue[msgGuildID][musicConfig.loopIndex[msgGuildID]].stream)
          play(client.queue[msgGuildID][musicConfig.loopIndex[msgGuildID]].stream, nLink);
        else play(nLink, nLink);
        played[msgGuildID].unshift(client.queue[msgGuildID][musicConfig.loopIndex[msgGuildID]]);
        musicConfig.loopIndex[msgGuildID]++;
        return;
      }
      if (musicConfig.loop[msgGuildID]) {
        let nowAndNext = client.queue[msgGuildID][0];
        if (nowAndNext.stream) play(nowAndNext.stream, nowAndNext.link);
        else play(nowAndNext.link, nowAndNext.link);
        if (played[msgGuildID][0] != nowAndNext) played[msgGuildID].unshift(nowAndNext);
        return;
      }
      await played[msgGuildID].unshift(client.queue[msgGuildID].shift());
      // create last played message if lastNPMessage and last played song exists
      if (lastNPMessage[msgGuildID] && played[msgGuildID][0]) {
        message.channel.fetchMessage(lastNPMessage[msgGuildID]).then(async msg => {
          if (npConfig[msgGuildID] == "stay") return;
          if (npConfig[msgGuildID] == "dl") return msg.delete();
          let playedSong = new Discord.RichEmbed()
            .setColor(guildTheme)
            .setTitle(guildStrings.played)
            .setDescription(`${played[msgGuildID][0].title}`)
            .setTimestamp();
          msg.edit(playedSong);
        });
      }
      client.log("Player", "", `Song ended on ${message.guild.name}`);
      if (channels[msgGuildID]) {
        let channel = client.channels.get(channels[msgGuildID]);
        channel.setTopic("");
      }
      // continue if the queue is not empty
      if (client.queue[msgGuildID].length !== 0) {
        let nLink = client.queue[msgGuildID][0].link;
        if (client.queue[msgGuildID][0].stream) play(client.queue[msgGuildID][0].stream, nLink);
        else play(nLink, nLink);
      } else vc.disconnect();

      // download songs if there is no stream
      if (client.queue[msgGuildID][2])
        if (!client.queue[msgGuildID][2].stream) {
          client.log("Player", "", "Downloading stream for queue[2] on" + message.guild.name);
          const link = client.queue[msgGuildID][2].link;
          client.queue[msgGuildID][2]["stream"] = ytdl(link, { filter: "audioonly" });
        }

      // autoplay
      if (musicConfig.autop[msgGuildID] && client.queue[msgGuildID].length < 3) {
        // get related videos from last song in queue
        ytdl.getInfo(
          client.queue[msgGuildID][client.queue[msgGuildID].length - 1].link,
          (err, info) => {
            if (err) client.log("Error", "ytdl", err);
            const rVid = info.related_videos[1];
            search(rVid, addOpts, (err, results) => {
              if (err) client.log("Error", "Youtube search", err);
              const result = filterResults(results);
              client.queue[msgGuildID].push({
                link: result.link,
                title: result.title,
                req: client.user.id,
                stream: ytdl(result.link, { filter: "audioonly" })
              });
            });
          }
        );
      }
    });
    vc.on("debug", info => client.log("Player", "Debug", `${msgGuildID}: ${info}`));
    vc.on("reconnecting", () =>
      client.log("Player", "Debug", `${msgGuildID} Reconnecting (${vc.channel.name})`)
    );
    vc.on("warn", warning => client.log("Player", "Debug", `${msgGuildID}: ${warning}`));
  }

  /**
   * @description sends message of song to text channel if there is a dispatcher playing
   * @returns Message
   */
  function nowPlaying() {
    if (!isPlaying()) return message.channel.send(noPlaying);
    message.channel.startTyping();
    let np;
    ytdl.getInfo(client.queue[msgGuildID][0].link, (err, info) => {
      if (err) throw err;
      var secsRest = info.length_seconds % 60;
      var minutes = (info.length_seconds - secsRest) / 60;
      np = new Discord.RichEmbed().setTitle(guildStrings.np).setColor(guildTheme);
      if (client.queue[msgGuildID][0].spotify) np.setThumbnail(client.queue[msgGuildID][0].spotify);
      else np.setThumbnail(info.thumbnail_url);

      if (info.media.song && info.media.artist) {
        np.addField(guildStrings.songtitle, info.media.song);
        np.addField(guildStrings.artist, info.media.artist);
      } else {
        np.addField(guildStrings.songtitle, info.title);
        np.addField("Video Uploader", info.author.name);
      }
      np.addField(guildStrings.length, `\`${minutes}:${secsRest}min\``, true);
      np.addField(guildStrings.req, `<@!${client.queue[msgGuildID][0].req}>`, true);
      message.channel.send(np).then(m => {
        message.channel.fetchMessage(lastNPMessage[msgGuildID]).then(m => m.delete());
        lastNPMessage[msgGuildID] = m.id;
      });
      message.channel.stopTyping();
    });
  }

  /**
   * @description Get RichEmbed with queue of guild
   * @returns Message to dc text channel
   */
  function list() {
    let msg = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.noQ);
    if (!client.queue[msgGuildID]) return message.channel.send(msg);
    let titles = [];
    let length = client.queue[msgGuildID].length > 11 ? 11 : client.queue[msgGuildID].length;
    for (let i = 0; i < length; i++) {
      if (i === 0) titles.push(`>> ${client.queue[msgGuildID][0].title}`);
      else titles.push(`${i}. ${client.queue[msgGuildID][i].title}`);
    }
    let dashboard =
      process.platform == "linux"
        ? `https://musicbot.ga/music/${message.guild.id}`
        : "https://localhost:8080";
    var list = new Discord.RichEmbed()
      .setDescription(
        `:notes: **[${guildStrings.queue} ${
          message.guild.name
        }](${dashboard})**\`\`\`md\n${titles.join("\n")}\`\`\``
      )
      .setColor(guildTheme)
      .setFooter(`${guildStrings.complQ} (${dashboard})`);
    message.channel.send(list);
  }

  /**
   * @description Function for search command that gives top yt results in an embed
   * @returns Promise<Message> / void
   */
  function searchCommand() {
    let searchQ = args.join(" ");
    if (!client.queue[msgGuildID]) client.queue[msgGuildID] = [];
    search(searchQ, opts, async (err, results) => {
      if (err) throw err;
      let titles = [];
      for (let i = 0; i < 5; i++) titles.push(`${i + 1}. ${results[i].title}`);
      let search = new Discord.RichEmbed()
        .setColor(guildTheme)
        .setTitle(guildStrings.general.results)
        .setDescription(`\`\`\`md\n${titles.join("\n")}\`\`\``);
      await message.channel.send(search);
      let filter = m => m.author.id == message.author.id;
      let c = message.channel.createMessageCollector(filter, { time: 20000 });
      c.on("collect", async e => {
        if (isNaN(e.content)) return c.stop();
        await client.queue[msgGuildID].push({
          title: results[Number(e.content) - 1].title,
          link: results[Number(e.content) - 1].link,
          req: message.author.id
        });
        c.stop();
        if (!isPlaying()) {
          if (client.queue[msgGuildID][0].stream)
            play(client.queue[msgGuildID][0].stream, client.queue[msgGuildID][0].link);
          else play(client.queue[msgGuildID][0].link, client.queue[msgGuildID][0].link);
        } else e.react("✅");
      });
    });
  }

  /**
   * @description Change status of discord client
   * @param {String} status discord presence status
   */
  function changeBotStatus(status) {
    if (
      client.config.admins.indexOf(message.author.id) == -1 ||
      message.member.hasPermission("ADMINISTRATOR") == false
    )
      return message.react("❌");
    if (client.config.presences.indexOf(status) == -1) return message.channel.send(noArgs);
    client.user.setStatus(status);
    message.react("✅");
  }

  /**
   * @description Destroys the discord client
   */
  function logoutClient() {
    if (client.config.admins.indexOf(message.author.id) == -1) return message.react("❌");
    clientEmbeds.disconnect.setTimestamp();
    client.channels
      .get(client.config.channels.log)
      .send(clientEmbeds.disconnect)
      .then(client.destroy());
  }

  function clearQueue() {
    let msg = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.noQ);
    if (!client.queue[msgGuildID] || !client.queue[msgGuildID][0]) return message.channel.send(msg);
    let nowp = client.queue[msgGuildID][0];
    client.queue[msgGuildID] = [];
    client.queue[msgGuildID].push(nowp);
    msg.setDescription(guildStrings.clearedQueue);
    message.channel.send(msg);
  }

  function seekTimeStamp(timestamp) {
    let q = client.queue[msgGuildID];
    play(q[0].stream, q[0].link, timestamp);
  }

  /**
   * @description Command that en/disables looping for single song or queue on a guild
   */
  function loop() {
    let loopMsg = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.loop);
    if (args[0] == "all") {
      if (!musicConfig.loopAll[msgGuildID]) {
        musicConfig.loopAll[msgGuildID] = true;
        musicConfig.loopIndex[msgGuildID] = 0;
        if (musicConfig.loop[msgGuildID]) delete musicConfig.loop[msgGuildID];
        loopMsg.setDescription(guildStrings.loopAll);
        message.channel.send(loopMsg);
      } else {
        delete musicConfig.loopAll[msgGuildID];
        loopMsg.setDescription(guildStrings.loopOff);
        message.channel.send(loopMsg);
      }
    } else {
      if (!musicConfig.loop[msgGuildID]) {
        musicConfig.loop[msgGuildID] = true;
        if (musicConfig.loopAll[msgGuildID]) delete musicConfig.loopAll[msgGuildID];
        message.channel.send(loopMsg);
      } else {
        delete musicConfig.loop[msgGuildID];
        loopMsg.setDescription(guildStrings.loopOff);
        message.channel.send(loopMsg);
      }
    }
  }

  /**
   * @description Command to en/disable autoplay on a guild
   */
  function autoplay() {
    let msg = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.autoplay);
    if (!musicConfig.autop[msgGuildID]) {
      musicConfig.autop[msgGuildID] = true;
      message.channel.send(msg);
      client.log("Player", "", `${msgGuildID}: Autoplay activated`);
    } else {
      delete musicConfig.autop[msgGuildID];
      msg.setDescription(guildStrings.autoplayOff);
      message.channel.send(msg);
      client.log("Player", "", `${msgGuildID}: Autoplay deactivated`);
    }
  }

  /////////////////////////////////////////////////
  // CURRENT COMMAND HANDLER SWITCH
  /////////////////////////////////////////////////

  // main switch to execute commands
  switch (command) {
    case "status":
      if (!args[0]) return message.channel.send(noArgs);
      changeBotStatus(args[0]);
      break;
    case "update":
      if (client.config.admins.indexOf(message.author.id) == -1) return message.react("❌");
      update(client, "discord", message.channel);
      break;
    case "logout":
      logoutClient();
      break;
    case "bits":
      if (!isPlaying()) return message.channel.send(noPlaying);
      if (!args[0]) return message.channel.send(noArgs);
      if (args[0] > 96) {
        let err = new Discord.RichEmbed()
          .setColor(client.config.colors.red)
          .setDescription(guildStrings.bitsHigh);
        return message.channel.send(err);
      }
      message.guild.voiceConnection.dispatcher.setBitrate(args[0]);
      let bitr = new Discord.RichEmbed().setColor(guildTheme);
      bitr.setDescription(client.languageReplace(guildStrings.bitrate, args[0]));
      message.channel.send(bitr);
      break;
    case "clear":
      clearQueue();
      break;
    case "ping":
      const pinging = await message.channel.send("Pinging...");
      const duration = moment
        .duration(client.uptime)
        .format(" D [days], H [h], m [mins], s [secs]");
      let clientPing = client.ping.toFixed(1);
      let pingMsg = new Discord.RichEmbed()
        .setColor(guildTheme)
        .setTitle(":ping_pong: Pong!")
        .setTimestamp();
      pingMsg.setDescription(
        `Ping: **${pinging.createdTimestamp -
          message.createdTimestamp}**ms\nAPI: **${clientPing}**ms \nUptime: **${duration}**`
      );
      pinging.edit(pingMsg);
      client.log("Info", "", `${clientPing} (Uptime: ${duration})`);
      break;
    case "bot":
      if (client.config.admins.indexOf(message.author.id) == -1) return message.react("❌");
      let bot = new Discord.RichEmbed()
        .setColor(guildTheme)
        .setAuthor(client.user.tag, client.user.avatarURL)
        .setDescription(
          `\`Created by: Johann Laur (Jhn()#3671)\nMemory: ${(
            process.memoryUsage().heapUsed /
            1024 /
            1024
          ).toFixed(2)} MB\n${
            guildStrings.general.user
          }: ${client.users.size.toLocaleString()}\nServer: ${client.guilds.size.toLocaleString()}\nVersion: ${
            packageJSON.version
          }\nDiscordJS: v${Discord.version}\nNode: ${process.version}\``
        );
      message.channel.send(bot);
      break;
    case "join":
      connectVC();
      break;
    case "connect":
      connectVC();
      break;
    case "disconnect":
      leaveVC();
      break;
    case "leave":
      leaveVC();
      break;
    case "stop":
      leaveVC();
      break;
    case "loop":
      loop();
      break;
    case "prefixes":
      message.channel.send(clientEmbeds.prefixes);
      break;
    case "prefix":
      if (!message.member.hasPermission("MANAGE_GUILD")) {
        let err = new Discord.RichEmbed()
          .setColor(client.config.colors.red)
          .setDescription(guildStrings.missingPerm);
        return message.channel.send(err);
      }
      if (!args[0]) return message.channel.send(clientEmbeds.prefixes);
      if (client.config.prefixes.indexOf(args[0]) !== -1) {
        prefixSets[msgGuildID] = args[0];
        fs.writeFile("./config/guild_prefix.json", JSON.stringify(prefixSets), err =>
          client.log("Error", "Fs#writefile", err)
        );
        let prefixSet = new Discord.RichEmbed()
          .setColor(guildTheme)
          .setDescription(
            client.languageReplace(guildStrings.sPrefix, args[0], `<@!${message.author.id}>`)
          );
        message.channel.send(prefixSet);
      } else {
        let prefixErr = new Discord.RichEmbed()
          .setDescription(guildStrings.prefErr)
          .setColor(client.config.colors.red);
        message.channel.send(prefixErr);
      }
      break;
    case "info":
      sendInfoMessage();
      break;
    case "np":
      if (args[0]) {
        if (args[0] == "delete" || args[0] == "dl") {
          writeNPMSGConfig(msgGuildID, "dl", message);
        } else if (args[0] == "replace" || args[0] == "default") {
          writeNPMSGConfig(msgGuildID, "default", message);
        } else if (args[0] == "stay") {
          writeNPMSGConfig(msgGuildID, "stay", message);
        }
        return;
      }
      nowPlaying();
      break;
    case "nowplaying":
      nowPlaying();
      break;
    case "song":
      nowPlaying();
      break;
    case "ff":
      let tsNow = message.guild.voiceConnection.dispatcher.time / 1000;
      seekTimeStamp(tsNow + 10);
      break;
    case "play":
      //if (!message.guild.me.hasPermission("READ_MESSAGE_HISTORY"))
      //return message.channel.send(messages.readHistory);
      if (!client.queue[msgGuildID]) client.queue[msgGuildID] = [];
      if (
        !args[0] &&
        message.guild.voiceConnection &&
        message.guild.voiceConnection.dispatcher &&
        message.guild.voiceConnection.dispatcher.paused
      )
        return message.guild.voiceConnection.dispatcher.resume();
      let noVC = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.noVC);
      // for many cases of errors later useful lol
      let serr = new Discord.RichEmbed()
        .setColor(client.config.colors.red)
        .setDescription(guildStrings.searchErr);

      if (!message.member.voiceChannel) return message.channel.send(noVC);
      if (!args[0] && client.queue[msgGuildID][0] && !isPlaying()) {
        if (client.queue[msgGuildID][0].stream) {
          play(client.queue[msgGuildID][0].stream, client.queue[msgGuildID][0].link);
        } else play(client.queue[msgGuildID][0].link, client.queue[msgGuildID][0].link);
        return;
      }
      if (!args[0]) return message.channel.send(noArgs);
      var joined = args.join(" ");
      if (args[0].includes("spotify") === true) {
        if (args[0].includes("playlist") === true || args[0].includes("album") === true) {
          spotify.getData(joined).then(data => {
            for (var i = 0; i < data.tracks.items.length; i++) {
              let link =
                args[0].includes("playlist") == true
                  ? data.tracks.items[i].track.external_urls.spotify
                  : data.tracks.items[i].external_urls.spotify;
              spotify.getPreview(link).then(track => {
                search(`${track.title} ${track.artist}`, opts, async (err, results) => {
                  const result = filterResults(results);
                  if (!err && data.tracks.items.length < 4)
                    await client.queue[msgGuildID].push({
                      link: result.link,
                      stream: ytdl(result.link, { filter: "audioonly" }),
                      title: result.title,
                      req: message.author.id,
                      spotify: data.image
                    });
                  else if (!err)
                    await client.queue[msgGuildID].push({
                      link: result.link,
                      title: result.title,
                      req: message.author.id,
                      spotify: data.image
                    });
                });
              });
            }

            let ownerArtist =
              args[0].includes("playlist") == true ? data.owner.display_name : data.artists[0].name;
            let date =
              args[0].includes("playlist") == true
                ? Date(data["last-checked-timestamp"])
                : data.release_date;
            let playlist = new Discord.RichEmbed()
              .setColor(guildTheme)
              .setDescription(
                client.languageReplace(
                  guildStrings.playlist,
                  data.name,
                  ownerArtist,
                  data.tracks.total,
                  date
                )
              )
              .setThumbnail(data.images[0].url)
              .setTimestamp();
            message.channel.send(playlist);
          });
        } else {
          spotify.getPreview(joined).then(data => {
            search(`${data.title}  ${data.artist}`, opts, (err, results) => {
              if (err) return message.channel.send(serr);
              let result = filterResults(results);
              client.queue[msgGuildID].push({
                link: result.link,
                stream: ytdl(result.link, { filter: "audioonly" }),
                title: result.title,
                req: message.author.id,
                spotify: data.image
              });
              if (!isPlaying()) {
                if (client.queue[msgGuildID][0].stream)
                  play(client.queue[msgGuildID][0].stream, client.queue[msgGuildID][0].link);
                else play(client.queue[msgGuildID][0].link, client.queue[msgGuildID][0].link);
              } else {
                let add = new Discord.RichEmbed()
                  .setColor(guildTheme)
                  .setDescription(`:musical_note: **${result.title}** ${guildStrings.qAdd}`);
                message.channel.send(add);
              }
            });
          });
        }
      } else if (args[0].includes("playlist?")) {
        ytpl(args[0], (err, result) => {
          if (err) client.log("Error", "Youtube-Playlist", err);
          for (var i = 0; i < result.items.length; i++) {
            const link = result.items[i].url_simple;
            const title = result.items[i].title;
            if (result.items.length < 4)
              client.queue[msgGuildID].push({
                link,
                stream: ytdl(link, { filter: "audioonly" }),
                title,
                req: message.author.id
              });
            else
              client.queue[msgGuildID].push({
                link,
                title,
                req: message.author.id
              });
            if (i === result.items.length - 1)
              play(client.queue[msgGuildID][0].link, client.queue[msgGuildID][0].link);
          }
          let pAdd = new Discord.RichEmbed()
            .setColor(guildTheme)
            .setDescription(
              client.languageReplace(
                guildStrings.playlist,
                result.title,
                result.author.name,
                result.total_items,
                result.last_updated
              )
            )
            .setTimestamp()
            .setThumbnail(result.items[0].thumbnail);
          message.channel.send(pAdd);
        });
      } else {
        search(joined, opts, async (err, results) => {
          if (err) {
            return message.channel.send(serr);
          }
          let result = await filterResults(results);
          client.queue[msgGuildID].push({
            title: result.title,
            link: result.link,
            stream: ytdl(result.link, { filter: "audioonly" }),
            req: message.author.id
          });
          if (!isPlaying()) {
            let link = client.queue[msgGuildID][0].link;
            if (client.queue[msgGuildID][0].stream) play(client.queue[msgGuildID][0].stream, link);
            else play(link, link);
          } else {
            let qAdd = new Discord.RichEmbed()
              .setColor(guildTheme)
              .setDescription(`:musical_note: **${result.title}** ${guildStrings.qAdd}`);
            message.channel.send(qAdd);
          }
        });
      }
      break;
    case "next":
      let joinedArgs = args.join(" ");
      if (args[0]) {
        search(joinedArgs, opts, async (err, results) => {
          if (err) return message.channel.send(serr);
          let result = await filterResults(results);
          await client.queue[msgGuildID].splice(1, 0, {
            title: result.title,
            link: result.link,
            stream: ytdl(result.link, { filter: "audioonly" }),
            req: message.author.id
          });
          let added = new Discord.RichEmbed()
            .setColor(guildTheme)
            .setDescription(`${result.title}`)
            .setTitle(guildStrings.addedNext);
          message.channel.send(added);
        });
      } else nextSong();
      break;
    case "skip":
      nextSong();
      break;
    case "pause":
      pauseDispatcher();
      break;
    case "search":
      searchCommand();
      break;
    case "s":
      searchCommand();
      break;
    case "p":
      pauseDispatcher();
      break;
    case "resume":
      if (!isPlaying()) return message.channel.send(noPlaying);
      if (!message.guild.voiceConnection.dispatcher.paused) {
        let notPaused = new Discord.RichEmbed()
          .setColor(client.config.colors.red)
          .setDescription(guildStrings.notPaused);
        return message.channel.send(notPaused);
      }
      message.guild.voiceConnection.dispatcher.resume();
      break;
    case "list":
      list();
      break;
    case "queue":
      list();
      break;
    case "songs":
      list();
      break;
    case "q":
      list();
      break;
    case "back":
      let backErr = new Discord.RichEmbed()
        .setColor(client.config.colors.red)
        .setDescription(guildStrings.noPlayed);
      if (!played[msgGuildID][0]) return message.channel.send(backErr);
      if (!isPlaying()) return message.channel.send(noPlaying);
      await client.queue[msgGuildID].splice(1, 0, played[msgGuildID][0]);
      message.guild.voiceConnection.dispatcher.end();
      let back = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.back);
      message.channel.send(back);
      break;
    case "volume":
      changeVolume();
      break;
    case "v":
      changeVolume();
      break;
    case "shuffle":
      if (!isPlaying()) return message.channel.send(noPlaying);
      let now = client.queue[msgGuildID].shift();
      let i = client.queue[msgGuildID].length;
      //if (i < 2) return console.log("too short");
      do {
        var zi = Math.floor(Math.random() * i);
        var t = client.queue[msgGuildID][zi];
        client.queue[msgGuildID][zi] = client.queue[msgGuildID][--i];
        client.queue[msgGuildID][i] = t;
      } while (i);
      if (client.queue[msgGuildID][0] != now) {
        client.queue[msgGuildID].push(client.queue[msgGuildID][0]);
        client.queue[msgGuildID][0] = now;
      }
      let shuffle = new Discord.RichEmbed()
        .setColor(guildTheme)
        .setDescription(guildStrings.shuffle);
      message.channel.send(shuffle);
      break;
    case "lyrics":
      if (!isPlaying() && !args[0]) return message.channel.send(noPlaying);
      let urlTitle = isPlaying()
        ? client.queue[msgGuildID][0].title.split(" ").join("%20")
        : args.join("%20");
      await message.channel.startTyping();
      let lyricsMsg = new Discord.RichEmbed().setColor(guildTheme);
      request(`https://some-random-api.ml/lyrics?title=${urlTitle}`, async (err, res, body) => {
        if (err != null) client.log("Error", "Request Err", `${err} (ResponseCode: ${res})`);
        let content = JSON.parse(body); // parse json response
        // return with error message if there are no lyrics in the response body
        if (!content.lyrics) {
          await message.channel.stopTyping();
          return message.channel.send({
            embed: { color: client.config.colors.red, description: `${content.error}` }
          });
        }
        let leftLyr = content.lyrics;
        await lyricsMsg
          .setTitle(content.title)
          .setFooter(`See lyrics on dashboard: musicbot.ga/lyrics/${msgGuildID}`)
          .setDescription(`${leftLyr.slice(0, 800 + leftLyr.slice(799).indexOf("\n"))}`);
        leftLyr = leftLyr.slice(800 + leftLyr.slice(799).indexOf("\n"));
        while (leftLyr.length > 1024) {
          let chars = leftLyr.slice(0, 800 + leftLyr.slice(799).indexOf("\n"));
          lyricsMsg.addField("\u200b", `${chars}`);
          leftLyr = leftLyr.slice(800 + leftLyr.slice(799).indexOf("\n"));
        }
        if ((leftLyr.length != 0 && leftLyr.length < 1024) || leftLyr.length == 1024) {
          lyricsMsg.addField("\u200b", `${leftLyr}`);
        }
        let filter = (reaction, user) =>
          reaction.emoji.name === "❌" && user.id === message.author.id;
        message.channel.send(lyricsMsg).then(m => {
          message.channel.stopTyping();
          m.react("❌");
          let c = m.createReactionCollector(filter, { time: 300000 });
          c.on("collect", () => {
            m.delete();
            message.delete();
            c.stop();
          });
        });
      });
      break;
    case "mainchannel":
      if (!message.member.hasPermission("MANAGE_GUILD"))
        return message.channel.send(
          new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.missingPerm)
        );
      let msgChannel = message.channel.id;
      channels[msgGuildID] = msgChannel;
      fs.writeFile("./config/main_channels.json", JSON.stringify(channels), err => {
        if (err) throw err;
      });
      let success = new Discord.RichEmbed()
        .setColor(guildTheme)
        .setDescription(client.languageReplace(guildStrings.mainc, message.channel.name));
      message.channel.send(success);
      break;
    case "invite":
      client
        .generateInvite([
          "SEND_MESSAGES",
          "MENTION_EVERYONE",
          "ADD_REACTIONS",
          "EMBED_LINKS",
          "READ_MESSAGES",
          "SPEAK",
          "CONNECT"
        ])
        .then(link => {
          client.log("Info", "", `Generated bot invite link: ${link}`);
          message.channel.send(`[Bot invite link](${link})`);
        })
        .catch(console.error);
      break;
    // language change command
    case "lang":
      if (!message.member.hasPermission("MANAGE_GUILD")) return message.react("❌");
      if (!args[0]) return message.channel.send(noArgs);
      if (args[0].length != 2) return message.channel.send(noArgs);
      updateGuildLang(message.guild.id, args[0].toLowerCase());
      let lang = new Discord.RichEmbed().setColor(guildTheme).setDescription(guildStrings.langSet);
      message.channel.send(lang);
      break;
    // get basic infos about guild and bot settings on that guild
    case "guild":
      let prefix = prefixSets[msgGuildID] ? prefixSets[msgGuildID] : client.config.prefix;
      let channel = channels[msgGuildID] ? channels[msgGuildID] : "-";
      let color = colorSets[msgGuildID] ? colorSets[msgGuildID] : "-";
      let guild = new Discord.RichEmbed()
        .setColor(guildTheme)
        .setTitle(`${message.guild.name}`)
        .setTimestamp()
        .setThumbnail(message.guild.iconURL)
        .setDescription(
          client.languageReplace(
            guildStrings.guild,
            prefix,
            message.guild.createdAt,
            message.guild.memberCount,
            channel,
            color
          )
        );
      message.channel.send(guild);
      break;
    case "remove":
      removeFromQueue();
      break;
    case "rm":
      removeFromQueue();
      break;
    // command to change color of embeds on each guild
    case "theme":
      let themeEm = new Discord.RichEmbed()
        .setColor(guildTheme)
        .setDescription(client.languageReplace(guildStrings.color, message.guild.name));
      if (!message.member.hasPermission("MANAGE_GUILD")) {
        themeEm.setColor(client.config.colors.red).setDescription(guildStrings.missingPerm);
        return message.channel.send(themeEm);
      }
      if (!args[0]) return message.channel.send(noArgs);
      if (isNaN(args[0])) {
        if (args[0].length != 7 || !args[0].startsWith("#")) {
          themeEm.setDescription(guildStrings.colorErr);
          return message.channel.send(themeEm);
        }
        colorSets[msgGuildID] = args[0];
        fs.writeFile("./config/guild_colors.json", JSON.stringify(colorSets), err =>
          client.log("Error", "Fs#writefile", err)
        );
        themeEm.setColor(colorSets[msgGuildID]);
        message.channel.send(themeEm);
      } else message.channel.send(themeEm.setDescription(guildStrings.colorErr));
      break;
    case "perfect":
      playTooPerfect();
      break;
    case "autoplay":
      autoplay();
      break;
    case "ap":
      autoplay();
      break;
    case "auto":
      autoplay();
      break;
  }
});

/////////////////////////////////////////////////
/////////////////////////////////////////////////

client.on("guildCreate", async guild => {
  notifyOwner(true, guild);
  updateGuildLang(guild.id, "en");
});
client.on("guildDelete", guild => notifyOwner(false, guild));

// login to dc
client.login(client.config.token);
