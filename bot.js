const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { Parser } = require('json2csv');

const token = '7866761897:AAFt6YawLCjiC36ou9ZXJ06EvPTItGw4QXw';
const bot = new TelegramBot(token, { polling: true });

const OWNER_CHAT_ID = 5763492989;
const userStates = {};

// 📍 Ruxsat berilgan joy (markaz)
const ALLOWED_LAT = 40.1379276;
const ALLOWED_LNG = 67.8267757;
const MAX_DISTANCE_METERS = 5000000;

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Yer radiusi (metr)
    const toRad = angle => angle * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const hour = new Date().getHours();

    if (hour < 20 && hour >= 19) {
        return bot.sendMessage(chatId, '⛔ Davomat faqat kechki 23:00 dan tonggi 5:00 gacha ochiq bo‘ladi.');
    }

    userStates[chatId] = { step: 'ask_name' };
    bot.sendMessage(chatId, 'Ismingizni kiriting:');
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const state = userStates[chatId];
    const text = msg.text;

    if (!state) return;

    const hour = new Date().getHours();
    if (hour < 20 && hour >= 19) {
        return bot.sendMessage(chatId, '⛔ Davomat faqat kechki 23:00 dan tonggi 5:00 gacha ochiq bo‘ladi.');
    }

    if (msg.location && state.step === 'check_location') {
        const userLat = msg.location.latitude;
        const userLng = msg.location.longitude;
        const distance = getDistanceMeters(userLat, userLng, ALLOWED_LAT, ALLOWED_LNG);

        if (distance > MAX_DISTANCE_METERS) {
            delete userStates[chatId];
            return bot.sendMessage(chatId, '❌ Siz ruxsat berilgan joydan tashqaridasiz. Davomat qilolmaysiz.');
        }

        state.step = 'ask_status';
        return bot.sendMessage(chatId, 'Bugun ishga kelganmisiz?', {
            reply_markup: {
                keyboard: [['✅ Ishdaman', '❌ Ishda emasman']],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }

    if (state.step === 'ask_name') {
        state.name = text.trim();
        state.step = 'ask_surname';
        return bot.sendMessage(chatId, 'Familyangizni kiriting:');
    }

    if (state.step === 'ask_surname') {
        state.surname = text.trim();
        state.step = 'check_location';
        return bot.sendMessage(chatId, '📍 Iltimos, joylashuvingizni yuboring:', {
            reply_markup: {
                keyboard: [[{
                    text: '📍 Joylashuvni yuborish',
                    request_location: true
                }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }

    if (state.step === 'ask_status' && (text === '✅ Ishdaman' || text === '❌ Ishda emasman')) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const jsonFile = `attendance-${dateStr}.json`;
        const csvFile = `attendance-${dateStr}.csv`;

        const record = {
            id: msg.from.id,
            name: `${state.name} ${state.surname}`,
            date: now.toLocaleDateString('uz-UZ'),
            time: now.toLocaleTimeString('uz-UZ'),
            status: text
        };

        let data = [];
        if (fs.existsSync(jsonFile)) {
            data = JSON.parse(fs.readFileSync(jsonFile));
        }

        data.push(record);

        fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
        bot.sendMessage(chatId, '✅ Davomatingiz saqlandi!');

        const parser = new Parser();
        const csv = parser.parse(data);
        fs.writeFileSync(csvFile, '\uFEFF' + csv);

        bot.sendDocument(OWNER_CHAT_ID, csvFile, {}, {
            filename: `attendance-${dateStr}.csv`,
            contentType: 'text/csv'
        });

        delete userStates[chatId];
    }
});
