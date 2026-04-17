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

let q = []
let bnd = new Map()

app.get('/', (req, res) => res.sendStatus(200))

app.get('/poll', (req, res) => {
    if (req.query.key !== cfg.key) return res.status(401).send()
    const ts = parseInt(req.query.ts) || 0
    res.json({ c: q.filter(x => x.ts > ts), ts: Date.now() })
})

setInterval(() => {
    const n = Date.now()
    q = q.filter(x => n - x.ts < 60000)
}, 10000)

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const cmds = [
    new SlashCommandBuilder().setName('bind').setDescription('Bind').addStringOption(o => o.setName('name').setRequired(true)),
    new SlashCommandBuilder().setName('kill').setDescription('Kill'),
    new SlashCommandBuilder().setName('re').setDescription('Respawn'),
    new SlashCommandBuilder().setName('r6').setDescription('R6'),
    new SlashCommandBuilder().setName('exe').setDescription('Global script').addStringOption(o => o.setName('code').setRequired(true)),
    new SlashCommandBuilder().setName('exe_at').setDescription('Target script').addStringOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('code').setRequired(true))
].map(c => c.toJSON())

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(cfg.token)
    await rest.put(Routes.applicationGuildCommands(cfg.clientId, cfg.guildId), { body: cmds })
})

client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return

    const st = i.member.roles.cache.has(cfg.roleStaff)
    const ac = i.member.roles.cache.has(cfg.roleAccess)

    if (!ac && !st) return i.reply({ content: 'Denied', ephemeral: true })

    if (i.commandName === 'bind') {
        const n = i.options.getString('name')
        for (let [k, v] of bnd.entries()) if (v === n) bnd.delete(k)
        bnd.set(i.user.id, n)
        return i.reply(`Bound: **${n}**`)
    }

    if (i.commandName === 'exe_at') {
        const t = i.options.getString('target')
        const c = i.options.getString('code')
        q.push({ c: 'EXE', a: c, t: t, ts: Date.now() })
        return i.reply(`Injected code for **${t}**`)
    }

    if (i.commandName === 'exe') {
        if (!st) return i.reply({ content: 'Staff only', ephemeral: true })
        q.push({ c: 'EXE', a: i.options.getString('code'), t: 'ALL', ts: Date.now() })
        return i.reply('Global execution sent.')
    }

    const b = bnd.get(i.user.id)
    if (!b) return i.reply({ content: 'Bind first', ephemeral: true })

    q.push({ c: i.commandName.toUpperCase(), a: null, t: b, ts: Date.now() })
    await i.reply(`${i.commandName.toUpperCase()} -> **${b}**`)
})

client.login(cfg.token)
app.listen(cfg.port)
