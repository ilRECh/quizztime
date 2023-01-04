import { google } from 'googleapis';
import {uuid} from "uuidv4";
// import { LessThanOneHour, parseDateAndTimeFrom } from './lib.js'; //TODO: planning a new feature

async function authCalendar() {
    const client = new google.auth.JWT({
            email: process.env.GOOGLE_CLIENT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replaceAll('\\n', '\n'),
            scopes: process.env.SCOPES
        }
    );

    const calendar = new google.calendar({
        version: 'v3',
        project: process.env.GOOGLE_PROJECT_NUMBER,
        auth: client
    });

    await client.authorize();

    return calendar;
}

async function getCalendar(ctx) {
    let calendarApi = await authCalendar();

    const result = await calendarApi.calendarList.list({
        maxResults: 10,
        showHidden: true,
        minAccessRole: 'reader'
    }).catch(error => ctx.reply('"' + error + '" from Google'));

    if(result.data.items.length <= 0) {
        return null;
    }

    let calendarsList = result.data.items.filter((value) => +value.description === ctx.message.chat.id);

    if(calendarsList.length <= 0) {
        return null;
    }

    return calendarsList[0];
}

async function calendarAdd(ctx, calendarId) {
    let calendarFromList = await getCalendar(ctx);

    if(calendarFromList) {
        ctx.reply('I already have a calendar for this chat: "' + calendarFromList.summary + '"');
        return;
    }

    const calendarApi = await authCalendar();

    try {
        const result = await calendarApi.calendarList.insert({
            requestBody: {
                id: calendarId,
            },
        });

        const resultCalendar = result.data;

        await calendarApi.calendars.update({
            calendarId,
            requestBody: {
                summary: resultCalendar.summary,
                description: ctx.message.chat.id.toString(),
            },
        });

        await calendarApi.events.watch({
            resource: {
                id: uuid(),
                type: 'web_hook',
                address: `https://${process.env.GOOGLE_CLOUD_REGION}-${process.env.GOOGLE_CLOUD_PROJECT_ID}.cloudfunctions.net/${process.env.FUNCTION_TARGET}`
            },
            calendarId
        });

        ctx.reply("Gotcha");
    } catch(error) {
        ctx.reply('"' + error + '" from Google');
    }
}


async function calendarList(ctx) {
    let calendarFromList = await getCalendar(ctx);

    if(!calendarFromList) {
        await ctx.reply('No calendars for this chat');
        return;
    }

    await ctx.reply('I have the "' + calendarFromList.summary + '" for this chat');
}

export async function calendarCmd(ctx) {
    let [,calendarId] = ctx.message.text.split(' ');

    if(!calendarId) {
        await calendarList(ctx);
    } else {
        await calendarAdd(ctx, calendarId);
    }
}

async function showEvents(ctx, amountToShow) {
    let calendarFromList = await getCalendar(ctx);

    if(!calendarFromList) {
        await ctx.reply('No calendars for this chat');
        return;
    }

    await authCalendar().then(async calendarApi => {
        await calendarApi.events.list({
            calendarId: calendarFromList.id,
            timeMin: new Date().toISOString(),
            maxResults: amountToShow,
            singleEvents: true,
            orderBy: 'startTime',
        }, async (error, result) => {
            if(error) {
                await ctx.reply('"' + error + '" from Google');
            } else {
                if(result.data.items <= 0) {
                    await ctx.reply('There are no upcoming events');
                    return;
                }

                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                const enumerate = result.data.items.length > 1 && amountToShow > 1;

                let counter = 0;
                for(let item of result.data.items) {
                    let message = '';
                    let startDate;
                    let showHoursAndMinutes = false;

                    if(item.start.hasOwnProperty('dateTime') &&
                        item.end.hasOwnProperty('dateTime')) {
                        showHoursAndMinutes = true;
                        startDate = new Date(item.start.dateTime);
                    } else {
                        startDate = new Date(item.start.date);
                    }

                    if(enumerate) {
                        message += (++counter).toString() + ". ";
                    }

                    message += item.summary || 'An event without a name';
                    message += '\n';

                    if(showHoursAndMinutes) {
                        message += 'At ' + startDate.getHours() + ':' + (startDate.getMinutes() || '00');
                    } else {
                        message += "(You didn't specify the time)";
                    }

                    message += ' on ' + startDate.getDate() +
                        '.' + (startDate.getMonth() + 1) +
                        '.' + startDate.getFullYear() +
                        ' ' + days[startDate.getDay()];

                    if(item.hasOwnProperty('location')) {
                        message += '\n\n';
                        message += 'Place:\n' + '`' + item.location + '`';
                    }

                    if(item.hasOwnProperty('description')) {
                        message += '\n\n';
                        message += 'Description:\n' + item.description;
                    }

                    await ctx.reply(message, {parse_mode: 'Markdown'});
                }
            }
        });
    });
}

export async function showBunchOfNextEventsCmd(ctx) {
    await showEvents(ctx, 10);
}

export async function showNextEventCmd(ctx) {
    await showEvents(ctx, 1);
}

export async function handleUpdateCalendar(headers, bot) {
    let calendarIdList = headers['x-goog-resource-uri'].match(/[^\/]*group.calendar.google.com/g);
    let calendarId;

    if(calendarIdList) {
        calendarId = calendarIdList[0];
    } else {
        return;
    }

    console.log(calendarId);

    calendarId = calendarId.replaceAll('%40', '@');

    console.log(calendarId);

    try {
        const calendarApi = await authCalendar();

        const events = await calendarApi.events.list({
            calendarId,
        });

        const calendar = await calendarApi.calendars.get({
            calendarId,
        })
    } catch (error) {
        console.log(error);
    }
}

//TODO: planning a new feature
// export async function newEvent(ctx) {
//
//     auth.getClient().then((res)=>{
//         calendar.calendarList.list({
//             auth:res,
//             maxResults: 10,
//             minAccessRole: 'reader',
//             showHidden: true
//         }, function(err, list) {
//             if (err) {
//                 console.log('There was an error contacting the Calendar service: ' + err);
//                 return;
//             }
//             console.log(list);
//         });
//     });
//     return;
//
//     let [_, textTime, textDate, textName, ...description] = ctx.message.text.split(' ');
//
//     if(!textTime || !textDate || !textName || !description.length) {
//         await ctx.reply('Something is wrong with the formatting of the command. Are you sure you didn't forget something?');
//         return;
//     }
//
//     if(textName.length > 10) {
//         await ctx.reply('Name of the event is too long. Did you forget to specify the name?');
//         return;
//     }
//
//     let date = parseDateAndTimeFrom(textTime + ' ' + textDate);
//
//     if(!date) {
//         await ctx.reply('Time or date have been specified incorrectly.');
//         return;
//     }
//
//     if(LessThanOneHour(date)) {
//         await ctx.reply('Less than one hour. Not my responsibility.');
//         return;
//     }
//
//     const startDate = new Date(date);
//     date.setHours(date.getHours() + 3);
//     const endDate = date;
//
//     const DAY_BEFORE = 24 * 60;
//     const HOUR_BEFORE = 60;
//
//     let event = {
//         'summary': textName.charAt(0).toUpperCase() + textName.slice(1),
//         'location': 'Belgrade,Serbia',
//         'description': description.join(' '),
//         'start': {
//             'dateTime': startDate,
//             'timeZone': 'Europe/Belgrade',
//         },
//         'end': {
//             'dateTime': endDate,
//             'timeZone': 'Europe/Belgrade',
//         },
//         'attendees': [],
//         'reminders': {
//             'useDefault': false,
//             'overrides': [
//                 {'method': 'email', 'minutes': DAY_BEFORE},
//                 {'method': 'email', 'minutes': HOUR_BEFORE},
//             ],
//         },
//     };
//
//     console.log(event);
//
//     auth.getClient().then((res)=>{
//         calendar.events.insert({
//             auth:res,
//             calendarId: GOOGLE_CALENDAR_ID,
//             resource: event,
//         }, function(err, event) {
//             if (err) {
//                 console.log('There was an error contacting the Calendar service: ' + err);
//                 return;
//             }
//             console.log('Event created: %s', event.data);
//             ctx.reply("Event successfully created!");
//         });
//     });
// }
