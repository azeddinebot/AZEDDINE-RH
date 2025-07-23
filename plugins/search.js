const google = require('google-it');

module.exports = {
    name: 'search',
    command: ['.google', '.search', 'ابحث'],
    description: 'للبحث في جوجل.',
    execute: async ({ sock, msg, args }) => {
        const query = args.join(' ');
        if (!query) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'اكتب شيئًا للبحث عنه. مثال:\n.search ما هي لغة جافاسكريبت' }, { quoted: msg });
            return;
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, { text: `🔎 جاري البحث عن "${query}"...` }, { quoted: msg });
            const results = await google({ query: query });
            
            let response = `*نتائج البحث عن: ${query}*\n\n`;
            results.slice(0, 5).forEach((item, index) => {
                response += `*${index + 1}. ${item.title}*\n`;
                response += `_${item.snippet}_\n`;
                response += `${item.link}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, { text: response.trim() }, { quoted: msg });
        } catch (error) {
            console.error('خطأ في البحث:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ حدث خطأ أثناء البحث.' }, { quoted: msg });
        }
    }
};
