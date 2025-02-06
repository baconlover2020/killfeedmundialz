// selfbot.js
require('dotenv').config();

const net = require('net');
const { Client } = require('discord.js-selfbot-v13');

// Load env variables
const DISCORD_USER_TOKEN = process.env.SELF_BOT_TOKEN;
const SOURCE_CHANNEL_ID = process.env.SOURCE_CHANNEL_ID;
const TCP_HOST = process.env.TCP_HOST || '127.0.0.1';
const TCP_PORT = parseInt(process.env.TCP_PORT || '5000', 10);

// Create the selfbot client
const client = new Client({ checkUpdate: false });

// We'll keep track of our TCP socket here
let socket = null;

// Attempt (re)connection to the TCP server
function connectToTcpServer() {
  socket = net.createConnection({ host: TCP_HOST, port: TCP_PORT }, () => {
    console.log(`[Selfbot] Connected to TCP server at ${TCP_HOST}:${TCP_PORT}`);
  });

  socket.on('error', (err) => {
    console.error('[Selfbot] TCP socket error:', err.message);
  });

  socket.on('close', () => {
    console.log('[Selfbot] TCP socket closed. Reconnecting in 5s...');
    setTimeout(connectToTcpServer, 5000);
  });
}

// When the selfbot is ready
client.on('ready', () => {
  console.log(`[Selfbot] Logged in as ${client.user.tag}`);
  // Start the TCP connection
  connectToTcpServer();
});

// On every new message
client.on('messageCreate', (message) => {
  // Only watch the specified source channel, ignore bot messages if desired
  if (message.channel.id !== SOURCE_CHANNEL_ID) return;
  // if (message.author.bot) return;

  // If the message contains at least one embed, forward them
  if (message.embeds.length > 0) {
    // Option A: Send ALL embeds as an array
    // const embedArray = message.embeds;

    // Option B: Send ONLY the first embed
    const embedArray = [message.embeds[0]];

    // Convert the array of embeds to JSON
    const payloadString = JSON.stringify(embedArray);

    // Send to TCP server (newline-delimited)
    if (socket && !socket.destroyed) {
      socket.write(payloadString + '\n');
      console.log('[Selfbot] Sent embed over TCP');
    }
  }
});

// Log in
client.login(DISCORD_USER_TOKEN).catch((err) => {
  console.error('[Selfbot] Login error:', err);
});
