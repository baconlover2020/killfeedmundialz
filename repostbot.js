// repost-bot.js
require('dotenv').config();

const net = require('net');
const { Client, GatewayIntentBits } = require('discord.js');

// Load env variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;
const LISTEN_TCP_PORT = parseInt(process.env.LISTEN_TCP_PORT || '6000', 10);

// Create a new Discord bot client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Once the bot is ready, start the TCP server
client.once('ready', () => {
  console.log(`[Repost Bot] Logged in as ${client.user.tag}`);
  startTcpServer();
});

function startTcpServer() {
  // Create a basic TCP server
  const server = net.createServer(async (socket) => {
    console.log('[Repost Bot] New TCP client connected.');

    socket.on('data', async (data) => {
      const rawString = data.toString().trim();

      try {
        // The selfbot sent an array of embed objects as JSON
        const embedArray = JSON.parse(rawString);

        // Fetch the target channel
        const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
        if (!targetChannel || !targetChannel.isTextBased()) {
          console.error('[Repost Bot] Invalid target channel or not text-based.');
          return;
        }

        // Send the embed(s) exactly as we received them
        await targetChannel.send({ embeds: embedArray });
        console.log('[Repost Bot] Posted embed to channel.');
      } catch (err) {
        console.error('[Repost Bot] Error parsing or sending embed:', err);
      }
    });

    socket.on('end', () => {
      console.log('[Repost Bot] TCP client disconnected.');
    });

    socket.on('error', (err) => {
      console.error('[Repost Bot] TCP socket error:', err);
    });
  });

  server.listen(LISTEN_TCP_PORT, () => {
    console.log(`[Repost Bot] TCP server listening on port ${LISTEN_TCP_PORT}`);
  });

  server.on('error', (err) => {
    console.error('[Repost Bot] TCP server error:', err);
  });
}

// Log in the bot
client.login(BOT_TOKEN).catch((err) => {
  console.error('[Repost Bot] Login failed:', err);
});
