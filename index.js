const express = require('express')
const { Client, GatewayIntentBits } = require('discord.js')
const axios = require('axios')

const app = express()
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] })

const cfg = {
    port: process.env.PORT || 3000,
    token: process.env.TOKEN,
    guildId: process.env.GUILD_ID,
    roleId: process.env.ROLE_ID
}

app.get('/', (req, res) => res.sendStatus(200))

app.get('/check', async (req, res) => {
    const id = req.query.id
    if (!id) return res.json({ r: false })

    try {
        const { data } = await axios.get(`https://registry.rover.link/api/guilds/${cfg.guildId}/roblox-to-discord/${id}`)
        if (!data.discordUsers || !data.discordUsers[0]) return res.json({ r: false })

        const g = await client.guilds.fetch(cfg.guildId)
        const m = await g.members.fetch(data.discordUsers[0].user.id)
        
        res.json({ r: m.roles.cache.has(cfg.roleId) })
    } catch {
        res.json({ r: false })
    }
})

client.login(cfg.token)
app.listen(cfg.port)
