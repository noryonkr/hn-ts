import { CommandClient } from '@pikokr/command.ts'
import Discord, { Intents, IntentsString, TextChannel, MessageEmbed, VoiceChannel } from 'discord.js'
import { config } from '../config'
import { Manager, Player } from 'erela.js'

export class Client extends CommandClient {
    audio: Manager

    constructor() {
        super({
            client: new Discord.Client({
                intents: ['GUILDS', 'GUILD_VOICE_STATES'],
            }),
            owners: 'auto', 
            command: {
                prefix: 's!!',
            },
            applicationCommands: {
                autoSync: true,
                guild: config.slash.guild,
            },
        })
        this.audio = new Manager({
             send: (id, payload) => {
                 const guild = this.client.guilds.cache.get(id)
                 if (guild) guild.shard.send(payload)
             },
             nodes: [
                 config.lavalink
             ],
             autoPlay: true
        })

        this.audio.on('nodeConnect', node => console.log('node connected'))

        this.audio.on('nodeDisconnect', node => console.log('node disconnected'))

        this.audio.on('nodeError', (node, err) => console.error(`Node error: `, err))

        this.audio.on('queueEnd', (player) => {
            (this.client.channels.cache.get(player.options.textChannel) as TextChannel).send('> 💿 **음악이 종료되었습니다**')
            player.destroy()
        })
        
        this.audio.on('trackStart', (player, track) => {
            (this.client.channels.cache.get(player.options.textChannel) as TextChannel).send(`> 🎶 \`${track.title}\`을(를) 재생합니다`)
            
        })
         this.audio.on('nodeReconnect', node => console.log(`node reconnecting..`))

         this.client.on('voiceStateUpdate', (oldState,newState) => {
            //if (oldState.channelId !==  oldState.guild.me?.voice.channelId || newState.channel)
             if (!oldState.channel?.members.filter(x=>!x.user.bot).size) {
                const player = this.audio.players.get(newState.guild.id)
                if (player) {
                    player.destroy();
                    (this.client.channels.cache.get(player?.options.textChannel) as TextChannel).send(`> 💿 **모든 사용자가 음성채널을 떠났습니다.**\n\`음악을 자동으로 종료합니다\``)
                 }
             }
             

         })

        this.registry.loadModulesIn('modules')
    }
}
