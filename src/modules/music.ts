import { Module, option, applicationCommand, applicationCommandArgumentConverter, messageSelectMenu } from "@pikokr/command.ts";
import { CommandInteraction, GuildMember } from 'discord.js'
import { Player } from 'erela.js'
import { cts } from "..";
import {inlineCode} from '@discordjs/builders'
import {MessageEmbed} from 'discord.js'
import moment from "moment";


class Music extends Module {
    @applicationCommandArgumentConverter(Player)
    player(i: CommandInteraction) {
        if (!(i.member instanceof GuildMember)) return
        const vc = i.member.voice.channelId
        if (!vc) return i.reply({ content: '음성 채널에 접속해 주세요', ephemeral: true })

        if (cts.audio.players.has(i.guildId!)) return cts.audio.players.get(i.guildId!)

        const player = cts.audio.create({
            guild: i.guild!.id,
            textChannel: i.channel!.id,
            voiceChannel: vc
        })
        player.connect()
        return player
    }

    @applicationCommand({
        command: {
            type: 'CHAT_INPUT',
            name: 'play',
            description: '음악을 재생합니다',
            options: [
                {
                    name: 'query',
                    type: 'STRING',
                    description: '검색어',
                    required: true
                }
            ]
        }
    })
    async play(i: CommandInteraction, player: Player, @option('query') query: string) {
        await i.deferReply()
        const result = await player.search(query, i.user)
        if (result.loadType === 'LOAD_FAILED') {
            return i.editReply({content: `결과 로드 실패: ${result.exception?.message}`})
        } else if (result.loadType === 'NO_MATCHES') {
            return i.editReply({content: '검색 결과가 없습니다'})
        } else if (result.loadType === 'PLAYLIST_LOADED') {
            player.queue.add(result.tracks)
            await i.editReply({content: `트랙 ${result.tracks.length}개가 로드되었습니다`})
        } else if (result.loadType === 'SEARCH_RESULT' || result.loadType === 'TRACK_LOADED') {
            player.queue.add(result.tracks[0])
            await i.editReply({content: `${inlineCode(result.tracks[0].title)}이(가) 추가되었습니다`})
        }

        if (!player.playing && !player.paused) player.play()
    }

    @applicationCommand({
        command: {
            type: 'CHAT_INPUT',
            name: 'volume',
            description: '음악의 볼륨을 조절합니다',
            options: [
                {
                    name: 'volume',
                    type: 'NUMBER',
                    description: '볼륨값',
                    required: true,
                    minValue: 1,
                    maxValue: 100
                }
            ]
        }
    })
    async volume(i: CommandInteraction, player: Player, @option('volume') volumeToChange: number) {
        player.setVolume(volumeToChange)
        await i.reply({content: `🔊 **볼륨이 \`${player.volume}%\`로 변경되었습니다!**`})
    }

    @applicationCommand({
        command: {
            type: 'CHAT_INPUT',
            name: 'skip',
            description: '스킵',
        }
    })
    async skip(i: CommandInteraction, player: Player) {
        player.stop()
        i.reply('스킵')
    }

    @applicationCommand({
        command: {
            type: 'CHAT_INPUT',
            name: 'nowplaying',
            description: '지금 재생중인 곡',

        }
    })
    async nowplaying(i: CommandInteraction, player: Player) {
        i.reply({embeds:[new MessageEmbed()
            .setAuthor(`${player.queue.current?.title}`,undefined,`${player.queue.current?.uri}`)
            // .setThumbnail(`${player.queue.current?.displayThumbnail?.('maxresdefault') ?? null}`)
            .setImage(player.queue.current?.uri?.includes('youtube') ? `https://i.ytimg.com/vi/${player.queue.current.identifier}/original.jpg` : '')
            .setColor("#3878d4")
            .addField('👩‍💼채널', `\`${player.queue.current?.author}\``,true)
            .addField('👩‍💻음악 요청', `${player.queue.current?.requester}`,true)
            .addField('💻생방송 여부',`${player.queue.current?.isStream? "🟢방송중":"🔴오프라인"}`,true)
            .addField('시간', `**${moment.duration(player.queue.current?.duration).hours()}시간 ${moment.duration(player.queue.current?.duration).minutes()}분 ${moment.duration(player.queue.current?.duration).seconds()}초**`)
            .setTimestamp()
            .setFooter(`requested by ${i.user.username}`,i.user.displayAvatarURL())
        ]})
        .catch(e=> console.log(e))

    }
    @applicationCommand({
        command: {
            type: 'CHAT_INPUT',
            name: 'queue',
            description: '지금까지 신청한 재생목록을 확인하세요',

        }
    })
    async queue(i: CommandInteraction, player: Player) {
        i.reply(`${player.queue.map(x=> x.title).join('\n')}`)
    }

    @applicationCommand({
        command: {
            type: 'CHAT_INPUT',
            name: 'stop',
            description: '음악을 종료합니다!'
        }
    })
    async stop(i: CommandInteraction, player: Player) {
        i.reply(`> 🎶음악을 종료했습니다!`)
        player.destroy()
    }
    
    @applicationCommand({
        command: {
            type: 'CHAT_INPUT',
            name: 'repeat',
            description: '반복을 끄거나 킵니다!',
            options: [
                {
                    name: '반복',
                    type: 'STRING',
                    description: '/repeat 한곡/모두/도움/확인'
                }
            ]
        }
    })
    async repeat(i: CommandInteraction, player: Player, @option('반복') query: string) {
        if (query=='도움'||query=='help'||query=='3') {
            i.reply({
                content:'**사용법:** \n/repeat 한곡/모두/끄기/도움/확인\n/repeat song/all/off/help/check\n/repeat 1/2/0/3/4',
                fetchReply: true})
            }
        if (query=='한곡'||query=='song'||query=='1') {
            await i.reply('> 반복모드가 한곡으로 전환 되었습니다!')
            player.setTrackRepeat(true)
            player.setQueueRepeat(false)
        }
        if (query=='모두'||query=='all'||query=='2') {
            await i.reply('> 반복모드가 모두로 전환 되었습니다!')
            player.setQueueRepeat(true)
            player.setTrackRepeat(false)
        }
        if (query=='끄기'||query=='off'||query=='0') {
            await i.reply('> 반복모드가 끄기로 전환 되었습니다!')
            player.setTrackRepeat(false)
            player.setQueueRepeat(false)
        }
        if (query=='확인'||query=='check'||query=='4') {
            i.reply(`> 🔁**현재 반복모드 상태는 다음과 같습니다!**\n\`모두: ${player.queueRepeat ? "🟢켜짐":"🔴꺼짐" }\`\n\`한곡: ${player.trackRepeat ? "🟢켜짐":"🔴꺼짐"}\``)
        }
    }
}
export function install() {
    return new Music()
} 
