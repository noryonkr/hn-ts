import { Client } from './structures/client'
import { config } from './config'
import {Jejudo} from 'jejudo'

export const cts = new Client()

export const jejudo = new Jejudo(cts.client, {isOwner: i => {
    return cts.owners.includes(i.user.id)
}})

jejudo.defaultPermission = true

cts.client.login(config.token)
