const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js')
const express = require('express')
const app = express()

const cfg = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    roleAccess: process.env.ROLE_ACCESS,
    roleStaff: process.env.ROLE_STAFF,
    key: process.env.KEY,
    port: process.env.PORT || 3000
}

let cmds = []

app.get('/', (q, s) => s.sendStatus(200))

app.get('/poll', (q, s) => {
    if (q.query.key !== cfg.key) return s.status(401).send()
    const lastSync = parseInt(q.query.ts) || 0
    s.json({ c: cmds.filter(c => c.ts > lastSync), ts: Date.now() })
})

setInterval(() => {
    cmds = cmds.filter(c => Date.now() - c.ts < 60000)
}, 10000)

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const commands = [
    new SlashCommandBuilder().setName('kill').setDescription('Kill player').addStringOption(o => o.setName('target').setDescription('Player name').setRequired(true)),
    new SlashCommandBuilder().setName('re').setDescription('Respawn player').addStringOption(o => o.setName('target').setDescription('Player name').setRequired(true)),
    new SlashCommandBuilder().setName('r6').setDescription('R6 player').addStringOption(o => o.setName('target').setDescription('Player name').setRequired(true)),
    new SlashCommandBuilder().setName('exe').setDescription('Execute code (All servers)').addStringOption(o => o.setName('code').setDescription('Lua code').setRequired(true))
].map(c => c.toJSON())

const rest = new REST({ version: '10' }).setToken(cfg.token)

client.once('ready', async () => {
    await rest.put(Routes.applicationGuildCommands(cfg.clientId, cfg.guildId), { body: commands })
})

client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return
    
    const hasAccess = i.member.roles.cache.has(cfg.roleAccess)
    const hasStaff = i.member.roles.cache.has(cfg.roleStaff)

    if (!hasAccess && !hasStaff) return i.reply({ content: 'Denied', ephemeral: true })

    if (i.commandName === 'exe') {
        if (!hasStaff) return i.reply({ content: 'Requires Staff Access', ephemeral: true })
        cmds.push({ cmd: 'EXE', arg: i.options.getString('code'), tgt: null, ts: Date.now() })
        await i.reply('Code executed on all active servers.')
    } else {
        const tgt = i.options.getString('target')
        cmds.push({ cmd: i.commandName.toUpperCase(), arg: null, tgt: tgt, ts: Date.now() })
        await i.reply(`${i.commandName.toUpperCase()} sent for ${tgt}.`)
    }
})

client.login(cfg.token)
app.listen(cfg.port)
