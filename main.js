const Carina = require('carina').Carina;
const ws = require('ws');

console.log('Connecting to Gateway...');

const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');
let config = JSON.parse(fs.readFileSync("config.json"));

var prefix = config.prefix;
var token = config.token;
var discordChannelId = config.discordChannelId;
var mixerChannelId = config.mixerChannelId;

// Discord Guts
client.once('connected', () => {
    console.log('Connected');
});

client.once('ready', () => {
    console.log('Ready');
});

client.on('error', () => {
    console.log('Error connecting. Check config.json for valid token!');
})

client.login(token);

// Mixer Guts
Carina.WebSocket = ws;

const ca = new Carina({ isBot: true}).open();
var online = 0;
var offline = 0;

ca.subscribe(`channel:${mixerChannelId}:update`, channel => {
    var live = channel.online;

    if(live == true) {
        if(online < 1)
        {
            sendEmbedToDiscord();
            online++;
            offline = 0;
        }
    }
    if(live == false) {
        if(offline < 1)
        {
            console.log('Channel Offline');
            clearLiveMessage();
            offline++;
            online = 0;
        }
    }
});

function sendEmbedToDiscord() {
    const request = require('request');

    request({
        url: "https://mixer.com/api/v1/channels/" + mixerChannelId,
        json: true
    }, (err, response, body) => {
        let username = body.user.username;
        let avatar = body.user.avatarUrl;
        let title = body.name;
        let url = "https://mixer.com/" + body.user.username;
        let game = body.type.name;
        let followers = body.numFollowers;
        let thumbnail = body.thumbnail.url;

        const liveEmbed = new Discord.RichEmbed()
        .setColor('1fbaed')
        .setTitle(title)
        .setURL(url)
        .setAuthor(username, avatar)
        .setThumbnail(avatar)
        .addField("Game", game, true)
        .addField("Followers", followers, true)
        .setImage(thumbnail);
    
        client.channels.get(discordChannelId).send('Hey @everyone, ' + username + ' is now live on <https://mixer.com/' + username + '>');
        client.channels.get(discordChannelId).send(liveEmbed);
    });
}

function clearLiveMessage() {
    var channel = client.channels.get(discordChannelId);

    channel.fetchMessages({limit: 2})
    .then(messages => messages.filter(m => m.delete()))
    .catch(console.error);
}