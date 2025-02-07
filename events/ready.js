let i = 0;
const fs = require('fs')
const chalk = require('chalk');
const nodelogger = require('hyperz-nodelogger')
const logger = new nodelogger()
const ms = require('ms')
const Importer = require('mysql-import');

module.exports = async(client, con, ready) => {

    try {
               
        if(client.config.autoImportSQL) {
        // MySQL Auto Importer Lolz
        try {

            con.query(`SELECT * FROM guilds`, async (err, row) => {
                if(row) {
                    console.log(chalk.bgBlueBright(`You can set the config variable for auto import to false now if you wish.`))
                } else {
                    const importer = new Importer(client.config.database);

                    // New onProgress method, added in version 5.0!
                    importer.onProgress(progress=>{
                    var percent = Math.floor(progress.bytes_processed / progress.total_bytes * 10000) / 100;
                    console.log(`${percent}% Completed`);
                    });
            
                    importer.import('install.sql').then(()=>{
                    var files_imported = importer.getImported();
                    console.log(`${files_imported.length} SQL file(s) imported.`);
                    }).catch(err=>{
                        if(client.config.debugmode) {
                            console.error(err);
                        }
                    });
                }
            });

        } catch(e) {
            if(client.config.debugmode) {
                console.log(e)
            }
        }
            
        }


        setTimeout(async () => {
            // Sexy Console Logger Thingy
            let commandcount = client.config.command_count;
            let eventcount = client.config.event_count;
            let frick = `${chalk.white(`Watching `)}${chalk.red(client.guilds.cache.size)}${chalk.white(' guilds with ')}${chalk.red(client.users.cache.size)}${chalk.white(' users!')}\n\n${chalk.white(`Client Tag: `)}${chalk.red(client.user.tag)}\n${chalk.white(`Client ID: `)}${chalk.red(client.user.id)}\n${chalk.white('Client Age: ')}${chalk.red(client.user.createdAt.toLocaleString())}\n\n${chalk.white(`Main Prefix: `)}${chalk.red(client.config.prefix)}${chalk.yellow(' (Default)')}\n${chalk.white(`Commands: `)}${chalk.red(commandcount)}\n${chalk.white(`Events: `)}${chalk.red(eventcount)}\n\n${chalk.white(`Created By: `)}${chalk.red('Hyperz#0001')}\n${chalk.white('Debug Mode: ')}${chalk.yellow(client.config.debugmode)}`;
            logger.hypelogger(`${client.user.username}`, '600', 'red', frick, 'disabled', 'red', 'single', true)
            
            await client.guilds.cache.forEach(async g => {
                await con.query(`SELECT * FROM guilds WHERE guildid='${g.id}'`, async(err, row) => {
                    if(err) throw err
                    if(row[0]) {
                        if(row[0].active === 'false') {
                            await con.query(`UPDATE guilds SET active='true' WHERE guildid='${g.id}'`, async(err, row) => {
                                if(err) throw err;
                            });
                        }
                    } else {
                        await con.query(`INSERT INTO guilds (active, guildid, prefix, autobans, autounbans, altprev, altprevtimer, inviteblocker, serverlock, logall) VALUES ('true', '${g.id}', '${client.config.prefix}', 'false', 'false', 'false', '30d', 'false', 'false', 'false')`, async (err, row) => {
                            if(err) throw err;
                        });
                    }
                });
            });
    
            await con.query(`SELECT * FROM guilds`, async (err, row) => {
                if(err) throw err;
                await row.forEach(async r => {
                    let deGuild = await client.guilds.cache.get(r.guildid)
                    if(deGuild == undefined) {
                        await con.query(`UPDATE guilds SET active='false' WHERE guildid='${r.guildid}'`, async (err, row) => {
                            if(err) throw err;
                        });
                    } else {
                        try {
                            if(deGuild.members.cache.find(client.user.id)) {
                                return;
                            } else {
                                await con.query(`UPDATE guilds SET active='false' WHERE guildid='${r.guildid}'`, async (err, row) => {
                                    if(err) throw err;
                                });
                            }
                        } catch(e) {
                            
                        }
                    }
                });
            });
    
            setTimeout(async () => {
                const channel = client.channels.cache.get(client.config.voicechanneltojoin);
                if (!channel) return console.error("The voice channel does not exist (change config's voicechanneltojoin)!");
                channel.join().then(connection => {
                    console.log("Successfully connected to the voice channel!")
                }).catch(e => {
                    console.error(e);
                });
            }, 3800);
        }, 2000)

        // Presence Settings
        let presence = [
            {name: `${client.user.username}`, type: "PLAYING", status: "dnd"},
            {name: `${client.config.prefix}help | ${client.config.prefix}setup`, type: "LISTENING", status: "dnd"},
            {name: `${client.users.cache.size} users!`, type: "WATCHING", status: "dnd"},
            {name: `${client.guilds.cache.size} servers!`, type: "WATCHING", status: "dnd"}
        ];

	

        changeStatus(client, presence)

    } catch(e) {
        console.log(e)
    }

}

async function changeStatus(client, presence) {
    if (i >= presence.length) i = 0;
    await client.user.setPresence({
        activity: {
            name: presence[i].name,
            type: presence[i].type
        },
        status: presence[i].status
    });
    i++;
    setTimeout(() => {
        changeStatus(client, presence);
    }, 10000)

};