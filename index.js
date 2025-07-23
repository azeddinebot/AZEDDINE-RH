const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const readline = require('readline');

// إعداد yt-dlp عالميًا
const YTDlpWrap = require('yt-dlp-wrap').default;
const ytDlp = new YTDlpWrap();

// تخزين الأوامر
const commands = new Map();

// دالة لتوجيه الأسئلة في الطرفية
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// تحميل الإضافات (Plugins)
const pluginsPath = path.join(__dirname, 'plugins');
fs.readdirSync(pluginsPath).forEach(file => {
    if (file.endsWith('.js')) {
        const plugin = require(path.join(pluginsPath, file));
        if (plugin.command && plugin.execute) {
            const commandList = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
            commandList.forEach(cmd => commands.set(cmd, plugin));
        }
    }
});

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: [config.botName, 'Chrome', '1.0.0'],
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = await question(`الرجاء إدخال رقم واتساب الخاص بالبوت (مثال: ${config.ownerNumber}): `);
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`\n✅ رمز الاقتران الخاص بك هو: ${code}\n`);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('انقطع الاتصال، إعادة الاتصال:', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log(`🚀 تم الاتصال بنجاح! البوت "${config.botName}" يعمل الآن.`);
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (!messageText.startsWith(config.prefix)) return;

        const args = messageText.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = commands.get(commandName);

        if (command) {
            try {
                // تمرير كل ما يلزم إلى الإضافة
                await command.execute({ sock, msg, args, commandName, ytDlp, commands, config });
            } catch (error) {
                console.error(`خطأ في تنفيذ الأمر ${commandName}:`, error);
                await sock.sendMessage(msg.key.remoteJid, { text: '❌ حدث خطأ أثناء تنفيذ هذا الأمر.' }, { quoted: msg });
            }
        }
    });
}

connectToWhatsApp();
