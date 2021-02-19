// Init Database Local
const NodeCache = require("node-cache");
const dbcache = new NodeCache();

// Init Discord Client
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
client.login(config.token);

// Init Number Randomizer
var MersenneTwister = require("mersenne-twister");
var generator = new MersenneTwister();

/* -------------------------------
        Start Init functions 
------------------------------- */
 
// Add match to cache
function dbCacheAddMatch(memberID, matchID){
    dbcache.set(`match_${memberID}-${matchID}`, {matchs: true }, config.secondsMatchTimeout);
}

// Verify if match exist in cache
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

// Create channel in Discord
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
            member.voice.setChannel(vc).catch( console.error );
        }
    }).catch( console.error);
}

// Check channels to have better match
function channelCheck(categoryChannels, waitChannel, waitChannelMember){
    // If no Channel exist in Category, we will create it.
    if(categoryChannels.size === 0){
        createChannel(waitChannel.guild, waitChannel);
    } else {
        var n = 0; // Increment count
        move:
        for (const [, channel] of categoryChannels) {
            n++;
            if(channel.members.size === 1){
                for (const [memberIDMove, memberMove] of waitChannelMember) {
                    for( const [memberID] of channel.members){
                    // Verify if the member will be moved and member already in channel have already matched
                        if(dbCacheVerifyMatch(memberID, memberIDMove)){
                            // Next Channel Check
                            continue;
                        } else {
                            dbCacheAddMatch(memberID, memberIDMove);
                            memberMove.voice.setChannel(channel).catch(console.error);
                            break move;
                        }
                    }
                }  
            }
    
            // If loop increment equal channels size in category, create channel
            if(n === categoryChannels.size){
                createChannel(waitChannel.guild, waitChannel);
            }
        }
    }
}

// Verify if empty channel exist every 30s -> delete if true
function verifyVC(){
    const channels = client.channels.cache.filter( (c) => c.parentID === config.categoryID && c.type === "voice");

    for (const [, channel] of channels) {
        if(channel.members.size === 0){
            channel.delete("delete for new channels").catch( console.error);
        }
    }
    setTimeout( () => {
       verifyVC();
    }, 30000);
}


/* -------------------------------
        End Init functions 
------------------------------- */

// On Client Ready, check empty and waiting channels
client.on("ready", async() => {
    console.log(`√   Logged into Discord as ${client.user.username}!`);
    client.user.setStatus("dnd");

    client.user.setPresence({
        status: "online",
        activity: {
            name: "his creator DamsDev.me",
            type: "WATCHING"
        }
    });

    // Check waiting channel
    console.info("...   Check waiting channel");
    var waitChannel = client.channels.cache.get(config.waitChannelID);
    const channels = client.channels.cache.filter( (c) => c.parentID === config.categoryID && c.type === "voice");
    

    if(waitChannel.type === 'voice' && waitChannel.members.size === 1 ){
        channelCheck(channels, waitChannel, waitChannel.members);
    } else {
        for (const [memberID, member] of waitChannel.members) {
            member.voice.setChannel(null).catch(console.error);
        }
        if(waitChannel.userLimit !== 1){
            waitChannel.setUserLimit(1, "It's a requirement for the bot");
        }
    }
    
    console.log("√   Waiting channels checked !");

    // Check empty channels -> if empty, channel was deleted
    console.info("...   Check empty channels");
    verifyVC();
    console.log("√   Empty channels checked !");
});


// When user connect to channel, verify multiples things and move user
client.on("voiceStateUpdate", (oldState, newState) => {
    if (newState.channel){
        if ( (newState.channel.id === config.waitChannelID) && (newState.channel.members.size === 1)) {
            const channels = client.channels.cache.filter( (c) => c.parentID === config.categoryID && c.type === "voice");
            channelCheck(channels, newState.channel, newState.channel.members);
        }
    }

    if(oldState.channel){
        if(oldState.channel.name.startsWith("Vocal") && oldState.channel.parentID === config.categoryID){
            if(oldState.channel.members.size === 0){
                oldState.channel.delete("nobody in this channel").catch(console.error);
            }
        }
    }
});

