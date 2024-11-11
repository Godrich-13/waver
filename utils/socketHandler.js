const fs = require('fs');
const path = require('path');

function socketHandler(sock, accountId, keywordResponses) {
    sock.ev.on('messages.upsert', async (messageUpdate) => {
        const message = messageUpdate.messages[0];
        if (!message.key.fromMe && message.message?.conversation) {
            const chatId = message.key.remoteJid;
            const text = message.message.conversation.toLowerCase();

            const matchedKeyword = Object.keys(keywordResponses).find((keyword) =>
                text.includes(keyword)
            );

            if (matchedKeyword) {
                const response = keywordResponses[matchedKeyword];
                const mediaPath = path.resolve(__dirname, '../', response.media);

                if (fs.existsSync(mediaPath)) {
                    const messageOptions = {};
                    if (response.media.endsWith('.jpg') || response.media.endsWith('.png')) {
                        messageOptions.image = { url: mediaPath };
                    }
                    messageOptions.caption = response.text;
                    await sock.sendMessage(chatId, messageOptions);
                } else {
                    await sock.sendMessage(chatId, { text: response.text });
                }
            }
        }
    });
}

module.exports = socketHandler;
