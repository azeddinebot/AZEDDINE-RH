const fs = require('fs');

module.exports = {
    name: 'downloader',
    command: ['.fb', '.yt', '.tk', 'video', 'فيديو'],
    description: 'تنزيل فيديوهات من (فيسبوك, يوتيوب, تيك توك) عبر الرابط.',
    execute: async ({ sock, msg, args, ytDlp }) => {
        const url = args[0];
        if (!url || !url.startsWith('http')) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'أرسل رابطًا صالحًا بعد الأمر. مثال:\n.fb https://...' }, { quoted: msg });
            return;
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, { text: '⏳ جاري المعالجة... قد يستغرق الأمر دقيقة.' }, { quoted: msg });
            
            const videoPath = `./temp_${Date.now()}.mp4`;
            await ytDlp.exec([url, '-f', 'best[ext=mp4]/best', '-o', videoPath]);

            if (fs.existsSync(videoPath)) {
                await sock.sendMessage(msg.key.remoteJid, {
                    video: fs.readFileSync(videoPath),
                    caption: '✅ تفضل الفيديو الخاص بك!',
                    mimetype: 'video/mp4'
                }, { quoted: msg });
                fs.unlinkSync(videoPath);
            } else {
                throw new Error('لم يتم العثور على ملف الفيديو بعد التنزيل.');
            }
        } catch (error) {
            console.error('خطأ في التنزيل:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ فشل تنزيل الفيديو. تأكد من أن الرابط عام ومدعوم.' }, { quoted: msg });
        }
    }
};
