/**
 * @author Michel Hühn
 * @exports Object with all rich embeds
 * @deprecated
 */

const config = require("../config/config.json");
const Discord = require("discord.js");

var noVC = new Discord.RichEmbed()
  .setDescription(":no_entry_sign: Vous n'êtes pas dans un salon vocal.")
  .setColor(config.colors.red);

var noAdmin = new Discord.RichEmbed()
  .setColor(config.colors.red)
  .setDescription(
    ":no_entry_sign: Vous devez être administrateur du bot pour utiliser cette commande."
  );

var statusCH = new Discord.RichEmbed()
  .setTitle("Changed status")
  .setColor(config.colors.blue)
  .setTimestamp();

var disconnect = new Discord.RichEmbed()
  .setColor(config.colors.red)
  .setTitle("Disconnected")
  .setTimestamp();

var clearMsg = new Discord.RichEmbed()
  .setTitle(":put_litter_in_its_place: Effacé la file d'attente")
  .setColor(config.colors.blue);

var reconnect = new Discord.RichEmbed()
  .setColor(config.colors.lello)
  .setTitle("Reconnecting")
  .setTimestamp();

var readyEmbed = new Discord.RichEmbed()
  .setTitle("Hallihallo meine Lieben")
  .setDescription("Bot & Webinterface Ready")
  .setColor(config.colors.green)
  .setTimestamp();

var errorEmbed = new Discord.RichEmbed()
  .setTitle("Client Error occured")
  .setColor(config.colors.red)
  .setTimestamp();

var infoMsg = new Discord.RichEmbed()
  .setTitle("Information du Cadence")
  //.setDescription("Musikbot, der bald viele tolle Funktionen haben wird...")
  .setColor(config.colors.blue)
  .addField(
    "Commandes de base",
    `${config.prefix}play, ${config.prefix}p/pause, ${config.prefix}volume, ${config.prefix}next, ${
      config.prefix
    }stop, ${config.prefix}prefix`
  )
  .addField(
    "Commandes et options de contrôle avancées",
    "[https://musicbot.ga:8893/commands](https://musicbot.ga:8893/commands)"
  )
  .setFooter("© Johann - Cadence")
  .setTimestamp();

var noSong = new Discord.RichEmbed()
  .setTitle(":neutral_face: Aucune chanson ou file d'attente donnée")
  .setColor(config.colors.red);

var noArgs = new Discord.RichEmbed()
  .setTitle("Bah... :neutral_face: (Arguments manquants)")
  .setColor(config.colors.red);

var joined = new Discord.RichEmbed()
  .setDescription(":white_check_mark: Salon rejoint")
  .setColor(config.colors.blue);

var disconnectVC = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setDescription(":x: Déconnecte");

var noPlaying = new Discord.RichEmbed()
  .setTitle(":exclamation: Ne jouant rien")
  .setColor(config.colors.red);

var backErr = new Discord.RichEmbed()
  .setColor(config.colors.red)
  .setDescription(":no_entry_sign: Il n'y a rien derrière cette chanson dans la file d'attente.");

var resu = new Discord.RichEmbed()
  .setColor(config.colors.lello)
  .setTimestamp()
  .setTitle("Resume");

var test = new Discord.RichEmbed().setColor(config.colors.lello).setTitle("Test Message");

var debug = new Discord.RichEmbed().setColor(config.colors.blue).setTitle("Debugging Information");

var pingMsg = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setTitle("Pong!")
  .setFooter(`Plus d'informations sur le statut du Cadence: ${config.prefix}bot`)
  .setTimestamp();

var botInfo = new Discord.RichEmbed().setColor(config.colors.blue).setTimestamp;

var noQ = new Discord.RichEmbed()
  .setColor(config.colors.red)
  .setDescription("La file d'attente est vidée");

var skipped = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setDescription(":track_next: Chanson sautée...");

var skipInterface = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setFooter("Avec l'interface web");

var connectErr = new Discord.RichEmbed()
  .setTitle("Erreur")
  .setDescription("Permission manquante `Se connecter`")
  .setColor(config.colors.red);

var speakErr = new Discord.RichEmbed()
  .setTitle("Erreur")
  .setColor(config.colors.red)
  .setDescription("Permission manquante `Parler`");

var volumeErr = new Discord.RichEmbed()
  .setTitle("Avertissement")
  .setDescription(
    "Vous ne devez pas dépasser un volume de 200% (les valeurs inférieures à 0 sont impossibles)"
  )
  .setColor(config.colors.red);

var volumeSet = new Discord.RichEmbed().setColor(config.colors.blue);
var volume = new Discord.RichEmbed().setColor(config.colors.blue);

var back = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setDescription(":track_previous: Joue la chanson précédente...");

var qAdd = new Discord.RichEmbed().setColor(config.colors.blue).setTimestamp();

var permsErr = new Discord.RichEmbed()
  .setColor(config.colors.red)
  .setDescription("Permission manquante")
  .setTitle("Erreur");

var prefix = new Discord.RichEmbed().setColor(config.colors.lello).setTimestamp();

var prefixErr = new Discord.RichEmbed().setColor(config.colors.red);

var shuffle = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setDescription(":twisted_rightwards_arrows: La file d'attente a été mélangée");

var volumeReset = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setDescription(":loudspeaker: Le volume a été remis à zéro (0db/100%)");

var loop = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setDescription(":repeat_one: Répétition de la chanson est activée");

var loopOff = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setDescription(":red_circle: Répétition de la chanson est désactivée");

var loopAll = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setDescription(":repeat: Répétition de la file d'attente");

var list = new Discord.RichEmbed()
  .setColor(config.colors.blue)
  .setTitle("la file d'attente")
  .setTimestamp();

var searchErr = new Discord.RichEmbed()
  .setColor(config.colors.red)
  .setTimestamp()
  .setTitle("Je n'ai trouvé aucun vidéo");

var loadQ = new Discord.RichEmbed().setTimestamp().setColor(config.colors.blue);
var bitr = new Discord.RichEmbed().setColor(config.colors.blue);

var notSaved = new Discord.RichEmbed()
  .setColor(config.colors.red)
  .setDescription(":x: No file d'attente saved");

//export rich embeds
module.exports = {
  notSaved,
  loadQ,
  bitr,
  volumeSet,
  searchErr,
  list,
  volumeReset,
  prefixErr,
  loop,
  loopAll,
  loopOff,
  prefix,
  back,
  permsErr,
  qAdd,
  volume,
  volumeErr,
  connectErr,
  speakErr,
  noVC,
  noAdmin,
  noArgs,
  statusCH,
  disconnect,
  clearMsg,
  reconnect,
  readyEmbed,
  errorEmbed,
  infoMsg,
  noSong,
  joined,
  disconnectVC,
  noPlaying,
  backErr,
  resu,
  test,
  debug,
  pingMsg,
  botInfo,
  noQ,
  skipped,
  skipInterface,
  shuffle
};
