import { listener, Module, applicationCommand } from '@pikokr/command.ts'
import { Client } from '../structures/client'
import { CommandInteraction, Interaction, MessageEmbed } from 'discord.js'
import { jejudo } from '..'
import {config} from '../config'

class Hello extends Module {
    constructor(private cts: Client) {
        super()
    }

    @applicationCommand({
        command: {
            type: 'CHAT_INPUT',
            name: 'help',
            description: '도움을 주세요!',
        },
    })
    async test(i: CommandInteraction) {
        const embed = new MessageEmbed()
        .setTitle("도움말")
        .setDescription('/help - 이것이다\n/play - 음악을 재생하는 명령이다.\n/skip - 음악을 스킵하는 명령이다\n/volume - 음악의 볼륨을 조정한다.\n\n**---------이 명령어들을 미완성이니 그점 알아주세요.-----------**')
        await i.reply({
            content: '그래 도움을 주겠노라..',
            ephemeral: true,
        })
            i.deleteReply()
            i.editReply({content:null,embeds:[embed]})
    }

    @applicationCommand({
        command: jejudo.commandJSON,
        guild: config.slash.devGuild
    })
    jejudo() {}

    @listener('interactionCreate')
    interactionCreate(i: Interaction) {
        return jejudo.run(i)
    }

    @listener('ready')
    ready() {
        this.logger.info(`Logged in as ${this.cts.client.user!.tag}`)
        this.cts.audio.init(this.cts.client.user!.id)
    }

    @listener('raw')
    raw(payload: any) {
        this.cts.audio.updateVoiceState(payload)
    }
}

export function install(cts: Client) {
    return new Hello(cts)
}
