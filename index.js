const express = require('express')
const { Client, GatewayIntentBits } = require('discord.js')
const axios = require('axios')

const app = express()
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] })

const cfg = {
    port: process.env.PORT || 3000,
    token: process.env.TOKEN,
    guildId: process.env.GUILD_ID,
    roles: process.env.ROLES ? process.env.ROLES.split(',') : []
}

app.get('/', (q, s) => s.sendStatus(200))

app.get('/check', async (q, s) => {
    const id = q.query.id
    if (!id) return s.json({ r: false })

    try {
        const { data } = await axios.get(`https://registry.rover.link/api/guilds/${cfg.guildId}/roblox-to-discord/${id}`)
        if (!data.discordUsers?.length) return s.json({ r: false })

        const g = await client.guilds.fetch(cfg.guildId)
        const m = await g.members.fetch(data.discordUsers[0].user.id)
        
        const ok = cfg.roles.some(r => m.roles.cache.has(r.trim()))
        s.json({ r: ok })
    } catch {
        s.json({ r: false })
    }
})

client.login(cfg.token)
app.listen(cfg.port)
