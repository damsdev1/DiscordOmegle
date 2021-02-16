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
const { Console } = require("console");
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
    Console.info("⬤   Uptime :" + time);
    setTimeout( () => {
        getUptime();
    }, 86400000);
}

// Verify if empty channel exist every 30s -> delete if true
function verifyVC(){
    const channels = client.channels.cache.filter( (c) => c.parentID === config.categoryID && c.type === "voice");

    for (const [channelID, channel] of channels) {
        if(channel.members.size === 0){
            channel.delete("making room for new channels").catch( (err) => { Console.log(err); });
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
    Console.log(cache);
    if(cache){
        return true;
    } else {
        cache = dbcache.get(`match_${matchID}-${memberID}`);
        Console.log(cache);
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

    const https = require("https");
    const options = {
        hostname: "raw.githubusercontent.com",
        port: 443,
        path: "/DamsDev1/test/main/.version.json",
        method: "GET"
    };
    const req = https.request( options, (res) => {      
        res.on("data", versionRemote => {
            if(versionRemote > versionProject){
                Console.log("An update is : https://github.com/DamsDev1/test");
            }
        });
    });
    req.on("error", (error) => {
        Console.error(error)
    });
    req.end();
    
}

// On Client Ready, check empty and waiting channels
client.on("ready", async() => {
    Console.log(`√   Logged into Discord as ${client.user.username}!`);
    client.user.setStatus("dnd");

    client.user.setPresence({
        status: "online",
        activity: {
            name: "his creator DamsDev.me",
            type: "WATCHING"
        }
    });

    // Check waiting channel
    Console.info("...   Check waiting channel");
    const waitChannelStart = client.channels.cache.filter( (c) => c.id === config.waitChannelID && c.type === "voice");

    for (const [channelID, channel10] of waitChannelStart) {
        if(channel10.members.size === 1){
            var guildChannel = client.guilds.cache.get(channel10.guild.id);
            guildChannel.channels.create("Vocal #" + Math.floor(generator.random()*10000), {
                type: "voice",
                userLimit: 2,
                parent: "769953745500766238",
                permissionOverwrites: [
                    {
                        id: channel10.guild.id,
                        deny: ["VIEW_CHANNEL"],
                    },
                ]
            }).then( (vc) => {
                for (const [memberID, member] of channel10.members) {
                    member.voice.setChannel(vc).catch( (err) => {Console.log(err);});
                }
            }).catch( (err) => { Console.log(err); });
        }
    }

    Console.log("√   Waiting channels checked !")


    // Check empty channels -> if empty, channel was deleted
    Console.info("...   Check empty channels");
    verifyVC();
    Console.log("√   Empty channels checked !");
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
                newState.guild.channels.create("Vocal #" + Math.floor(generator.random()*10000), {
                    type: "voice",
                    userLimit: 2,
                    parent: config.categoryID,
                    permissionOverwrites: [
                        {
                            id: newState.channel.guild.id,
                            deny: ["VIEW_CHANNEL"],
                        },
                    ]
                }).then( (vc) => {
                    for (const [memberID, member] of newState.channel.members) {
                        member.voice.setChannel(vc).catch( (err) => { Console.log(err); });
                    }
                }).catch( (err) => { Console.log(err); });
            } else {
                var n = 0; // Increment count
                move:
                for (const [channelID, channel] of channels) {
                    n++;
                    if(channel.members.size === 1){
                        for (const [memberIDMove, memberMove] of newState.channel.members) {
                            for( const [memberID, member] of channel.members){
                                // Verify if the member will be moved and member already in channel have already matched
                                if(dbCacheVerifyMatch(memberID, memberIDMove)){
                                    // Next Channel Check
                                    continue;
                                } else {
                                    dbCacheAddMatch(memberID, memberIDMove);
                                    memberMove.voice.setChannel(channel).catch( (err) => { Console.log(err); });
                                    break move;
                                }
                            }
                        }  
                    }

                    // If loop increment equal channels size in category, create channel
                    if(n === channels.size){
                        newState.guild.channels.create("Vocal #" + Math.floor(generator.random()*10000), {
                            type: "voice",
                            userLimit: 2,
                            parent: config.categoryID,
                            permissionOverwrites: [
                                {
                                    id: newState.channel.guild.id,
                                    deny: ["VIEW_CHANNEL"],
                                },
                            ]
                        }).then( (vc) => {
                            for (const [memberID, member] of newState.channel.members) {
                                member.voice.setChannel(vc).catch( (err) => { Console.log(err); });
                            }
                        }).catch( (err) => { Console.log(err); });
                    }
                }
            }
        }
    }

    if(oldState.channel){
        if(oldState.channel.name.startsWith("Vocal") && oldState.channel.parentID === config.categoryID){
            if(oldState.channel.members.size === 0){
                oldState.channel.delete("nobody in this channel").catch(Console.error);
            }
        }
    }
});

