const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { Parser } = require('json2csv');

const token = '7866761897:AAFt6YawLCjiC36ou9ZXJ06EvPTItGw4QXw'; 
const bot = new TelegramBot(token, { polling: true });

const FILE = 'attendance.json';
const OWNER_CHAT_ID = 5763492989;

const userStates = {};


bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'ask_name' };
    bot.sendMessage(chatId, 'Ismingizni kiriting:');
});


bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const state = userStates[chatId];
    const text = msg.text;

    if (!state) return;

    if (state.step === 'ask_name') {
        state.name = text.trim();
        state.step = 'ask_surname';
        return bot.sendMessage(chatId, 'Familyangizni kiriting:');
    }


    if (state.step === 'ask_surname') {
        state.surname = text.trim();
        state.step = 'ask_status';
        return bot.sendMessage(chatId, 'Bugun ishga kelganmisiz?', {
            reply_markup: {
                keyboard: [['✅ Ishdaman', '❌ Ishda emasman']],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }

    if (state.step === 'ask_status' && (text === '✅ Ishdaman' || text === '❌ Ishda emasman')) {
        const record = {
            id: msg.from.id,
            name: `${state.name} ${state.surname}`,
            date: new Date().toLocaleDateString('uz-UZ'),
            time: new Date().toLocaleTimeString('uz-UZ'),
            status: text
        };

        let data = [];
        if (fs.existsSync(FILE)) {
            data = JSON.parse(fs.readFileSync(FILE));
        }

        const index = data.findIndex(r => r.id === record.id && r.date === record.date);
        if (index > -1) data[index] = record;
        else data.push(record);

        fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
        bot.sendMessage(chatId, 'Davomatingiz saqlandi ✅');

        const parser = new Parser();
        const csv = parser.parse(data);
        const filePath = 'attendance.csv';
        fs.writeFileSync(filePath, '\uFEFF' + csv);

        bot.sendDocument(OWNER_CHAT_ID, filePath, {}, {
            filename: 'attendance.csv',
            contentType: 'text/csv'
        });

        delete userStates[chatId]; 
    }
});
