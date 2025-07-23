module.exports = {
    name: 'menu',
    command: ['.menu', '.help', 'مساعدة', 'الأوامر'],
    description: 'لعرض قائمة الأوامر المتاحة.',
    execute: async ({ sock, msg, commands, config }) => {
        let menuText = `*🤖 قائمة أوامر ${config.botName} 🤖*\n\n`;
        menuText += `أهلاً بك! استخدم البادئة *${config.prefix}* قبل أي أمر.\n\n`;

        const uniquePlugins = [...new Map(Array.from(commands.values()).map(p => [p.name, p])).values()];

        uniquePlugins.forEach(plugin => {
            if (plugin.name && plugin.description) {
                const commandList = Array.isArray(plugin.command) ? plugin.command.join(', ') : plugin.command;
                menuText += `*• ${plugin.name}:*\n`;
                menuText += `  ${plugin.description}\n`;
                menuText += `  *الأوامر:* \`${commandList}\`\n\n`;
            }
        });

        menuText += `صُنع بواسطة الذكاء الاصطناعي ✨`;
        
        await sock.sendMessage(msg.key.remoteJid, { text: menuText.trim() }, { quoted: msg });
    }
};
