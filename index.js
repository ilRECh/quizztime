import { Telegraf } from 'telegraf';
import { helpAction } from './lib.js';
import { calendarCmd, showNextEventCmd, showBunchOfNextEventsCmd, handleUpdateCalendar } from "./google_calendar_integration.js";

const bot = new Telegraf(process.env.BOT_TOKEN);
//TODO: find a way to make code independent by locations
process.env.TZ = 'Europe/Belgrade';

bot.start(helpAction);
bot.help(helpAction);

bot.command('calendar', calendarCmd);
bot.command('events', showBunchOfNextEventsCmd);
bot.command('whats_next', showNextEventCmd);

// For deploy on Google Cloud
bot.telegram.setWebhook(
    `https://${process.env.GOOGLE_CLOUD_REGION}-${process.env.GOOGLE_CLOUD_PROJECT_ID}.cloudfunctions.net/${process.env.FUNCTION_TARGET}` //FUNCTION_TARGET is reserved Google Cloud Env
);

export const commonWebhook = async (req, res) => {
    // await console.log(req.headers);

    if(req.headers['x-goog-resource-uri']) {
        handleUpdateCalendar(req.headers, bot);
    } else {
        bot.handleUpdate(req.body, res);
    }
};

// // Local testing environment
// bot.launch();
//
// // Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));
//
// console.log('Bot started');
