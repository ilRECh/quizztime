/**
 * An action related to /help command
 * @param ctx Context
 */
export async function helpAction(ctx) {
    await ctx.reply(
        'Hello there!\n'+
        'My name is Quizzy, and I\'m here to be at your service!'+
        'You help me, and I will help you! In order to process calendar events, I need a few actions from you.' +
        'Would you kindly do the following:\n' +
        '1. a) Go to calendar settings and sharing\n' +
        '    b) Proceed to "Share with specific people"\n' +
        '    c) Add `quizztime@calendar-integration-371009.iam.gserviceaccount.com` account\n' +
        '    d) Give to the account "Make changes and sharing" rights. This is important, but don\'t you worry! ' +
        'You always can find my creator, and check the code yourself. I just need an access to the "Description", that\'s all.' +
        'And by the way, I hope you don\'t use "Description" field, right?\n' +
        '2. a) Go to calendar settings and sharing\n' +
        '    b) Proceed to "Integrate calendar"\n' +
        '    c) Get the "Calendar ID" value\n' +
        '    d) Tell me that value via executing: /calendar \\[Calendar ID]\n\n' +
        'Thank you! Enjoy the comfort!\n\n' +
        'Commands description:\n' +
        '/start - show menu\n' +
        '/help - show this message\n' +
        '/calendar \\[Calendar ID] - show added calendars for this chat or add a calendar if the "Calendar ID" is specified\n' +
        '/whats\\_next - show next upcoming event\n' +
        '/events - show up to 10 upcoming events\n'
    , {parse_mode: 'Markdown'});
}

/**
 * Check if the date will expire in less than one hour
 * @param date passed date
 * @returns {boolean}
 */
export function LessThanOneHour(date) {
    if (!date) {
        return false;
    }

    return date.getTime() - Date.now() < 60 * 1000;
}

/**
 * Looks for time and date.
 * @param message
 * @returns {null|Date}
 */
export function parseDateAndTimeFrom(message) {
    let eventDate = getDateTZ(new Date(0));

    const timePattern = new RegExp('[0-9]{2}:[0-9]{2}');
    const datePatternWithYear = new RegExp('[0-9][0-9]?\\.[0-9][0-2]?\\.[0-9]{2}');
    const datePatternNoYear = new RegExp('[0-9][0-9]?\\.[0-9][0-2]?');

    let time = timePattern.exec(message);
    let date = datePatternWithYear.exec(message);

    if(!date) {
        date = datePatternNoYear.exec(message);
    }

    if(time && date) {
        let [ hour, minutes ] = time[0].split(':');
        let [ day, month, year ] = date[0].split('.');

        eventDate.setFullYear(
            year ? +year + 2000 : (getDateTZ(new Date())).getFullYear(),
            +month - 1,
            +day
        );
        eventDate.setHours(+hour, +minutes);

        return eventDate;
    }

    return null;
}
