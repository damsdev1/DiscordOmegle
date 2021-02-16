// Init Database Local
const NodeCache = require( "node-cache" );
const dbcache = new NodeCache();

// Init Discord Client
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
client.login(config.token);

// Init Number Randomizer
var MersenneTwister = require("mersenne-twister");
const logger = new console.Console(process.stdout, process.stderr);
var generator = new MersenneTwister();


// Get Uptime of bot every 24 hours
function getUptime(){
    let totalSeconds = (client.uptime / 1000);
    let time;
    let hours = Math.floor(totalSeconds / 3600);
    if(hours >= 24){
        time = Math.floor(totalSeconds / 86400) + "j";
    }
    else if(hours === 0){
        time = Math.floor(totalSeconds / 60) + "m";
        if(time === 0){
            time = Math.floor(totalSeconds % 60) + "s";
        }
    } else {
        time = hours + "h";
    }
    logger.info("⬤   Uptime :" + time);
    setTimeout( () => {
        getUptime();
    }, 24*60*60*1000);
}


function createChannel(guild, channel){
    guild.channels.create("Vocal #" + Math.floor(generator.random()*10000), {
        type: "voice",
        userLimit: 2,
        parent: config.categoryID,
        permissionOverwrites: [
            {
                id: channel.guild.id,
                deny: ["VIEW_CHANNEL"],
            },
        ]
    }).then( (vc) => {
        for (const [, member] of channel.members) {
            member.voice.setChannel(vc).catch( logger.error );
        }
    }).catch( logger.error);
}

// Verify if empty channel exist every 30s -> delete if true
function verifyVC(){
    const channels = client.channels.cache.filter( (c) => c.parentID === config.categoryID && c.type === "voice");

    for (const [, channel] of channels) {
        if(channel.members.size === 0){
            channel.delete("making room for new channels").catch( logger.error);
        }
    }
    setTimeout( () => {
       verifyVC();
    }, 30000);
}

// Add match to local database
function dbCacheAddMatch(memberID, matchID){
    dbcache.set(`match_${memberID}-${matchID}`, {matchs: true }, config.secondsMatchTimeout);
}

// Verify if match exist in local databse
function dbCacheVerifyMatch(memberID, matchID){
    var cache = dbcache.get(`match_${memberID}-${matchID}`);
    if(cache){
        return true;
    } else {
        cache = dbcache.get(`match_${matchID}-${memberID}`);
        if(cache) {
            return true;
        } else {
            return false;
        }
    }
}

// Verify Update Github
function updaterCheck(){
    var pjson = require("./package.json");
    var versionProject = pjson.version;

    function compareVersions(version1, version2) {

        version1 = version1.split(".");
        version2 = version2.split(".");
    
        var maxSubVersionLength = String(Math.max.apply(undefined, version1.concat(version2))).length;
    
        var reduce = function(prev, current, index) {
    
            return parseFloat(prev) + parseFloat("0." + Array(index + (maxSubVersionLength - String(current).length)).join("0") + current);
        };
    
        return version1.reduce(reduce) < version2.reduce(reduce);
    }
    

    const https = require("https");
    const options = {
        hostname: "raw.githubusercontent.com",
        port: 443,
        path: "/DamsDev1/DiscordOmegle/main/.version",
        method: "GET"
    };
    const req = https.request( options, (res) => {      
        res.on("data", (versionRemote) => {
            if(compareVersions(versionProject, versionRemote.toString())){
                logger.log("An update is available : https://github.com/DamsDev1/DiscordOmegle");
            }
        });
    });
    req.on("error", (error) => {
        logger.error(error);
    });
    req.end();
    
}


// On Client Ready, check empty and waiting channels
client.on("ready", async() => {
    logger.log(`√   Logged into Discord as ${client.user.username}!`);
    client.user.setStatus("dnd");

    client.user.setPresence({
        status: "online",
        activity: {
            name: "his creator DamsDev.me",
            type: "WATCHING"
        }
    });

    // Check waiting channel
    logger.info("...   Check waiting channel");
    const waitChannelStart = client.channels.cache.filter( (c) => c.id === config.waitChannelID && c.type === "voice");

    for (const [, channel] of waitChannelStart) {
        if(channel.members.size === 1){
            var guildChannel = client.guilds.cache.get(channel.guild.id);
            createChannel(guildChannel, channel);
        }
    }

    logger.log("√   Waiting channels checked !");


    // Check empty channels -> if empty, channel was deleted
    logger.info("...   Check empty channels");
    verifyVC();
    logger.log("√   Empty channels checked !");
    getUptime();
    updaterCheck();
});


// When user connect to channel, verify multiples things and move user
client.on("voiceStateUpdate", (oldState, newState) => {
    if (newState.channel){
        if ( (newState.channel.id === config.waitChannelID) && (newState.channel.members.size === 1)) {
            const channels = client.channels.cache.filter( (c) => c.parentID === config.categoryID && c.type === "voice");
                
            // If no Channel exist in Category, we will create it.
            if(channels.size === 0){
                createChannel(newState.guild, newState.channel);
            } else {
                var n = 0; // Increment count
                move:
                for (const [, channel] of channels) {
                    n++;
                    if(channel.members.size === 1){
                        for (const [memberIDMove, memberMove] of newState.channel.members) {
                            for( const [memberID] of channel.members){
                                // Verify if the member will be moved and member already in channel have already matched
                                if(dbCacheVerifyMatch(memberID, memberIDMove)){
                                    // Next Channel Check
                                    continue;
                                } else {
                                    dbCacheAddMatch(memberID, memberIDMove);
                                    memberMove.voice.setChannel(channel).catch(logger.error);
                                    break move;
                                }
                            }
                        }  
                    }

                    // If loop increment equal channels size in category, create channel
                    if(n === channels.size){
                        createChannel(newState.guild, newState.channel);
                    }
                }
            }
        }
    }

    if(oldState.channel){
        if(oldState.channel.name.startsWith("Vocal") && oldState.channel.parentID === config.categoryID){
            if(oldState.channel.members.size === 0){
                oldState.channel.delete("nobody in this channel").catch(logger.error);
            }
        }
    }
});

