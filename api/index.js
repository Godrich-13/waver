const express = require('express');
const path = require('path');
const qrcode = require('qrcode');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const socketHandler = require('../utils/socketHandler');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Store keyword responses dynamically
let keywordResponses = {
    otp: { media: 'media/otp.jpg', text: 'Default OTP message' },
    website: { media: 'media/otp.jpg', text: 'plusotp.com' }
};

// Endpoint to generate QR code
app.get('/api/connect/:accountId', async (req, res) => {
    const { accountId } = req.params;
    const { state, saveCreds } = await useMultiFileAuthState(`auth/${accountId}`);

    const sock = makeWASocket({ auth: state });
    sock.ev.on('connection.update', async (update) => {
        const { qr } = update;
        if (qr) {
            const qrCodeUrl = await qrcode.toDataURL(qr);
            res.send(`<img src="${qrCodeUrl}" alt="QR Code" />`);
        }
    });
    sock.ev.on('creds.update', saveCreds);
    socketHandler(sock, accountId, keywordResponses);
});

// Endpoint to update keywords and responses
app.post('/api/keywords', (req, res) => {
    const { keyword, media, text } = req.body;
    keywordResponses[keyword] = { media, text };
    res.status(200).send({ success: true, message: `Updated response for keyword: ${keyword}` });
});

module.exports = app;
