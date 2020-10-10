'use strict';

const { Telegraf, session } = require('telegraf')
const axios = require('axios')
const { get } = require('lodash')
const Sentry = require('@sentry/node');


module.exports.webhook = async event => {
  try {
    const bot = new Telegraf(process.env.TELEGRAM_TOKEN, {
      telegram: {
        webhookReply: false
      }
    });

// Add session for use in every context
    bot.use(session())

// Error handler
    Sentry.init({dsn: process.env.SENTRY_DNS});
    bot.catch((err) => {
      Sentry.captureException(err);
    });

// Logger
    bot.use(async (ctx, next) => {
      const start = new Date()
      await next()
      const response_time = new Date() - start
      const chat_from = `${get(ctx, 'message.chat.first_name', '')} (id: ${get(ctx, 'message.chat.id')})`
      console.log(`Chat from ${chat_from} (Response Time: ${response_time})`)
    });

// Commands from telegram
    bot.start(ctx => ctx.reply('Welcome!'))

// Get random CAT
    bot.command('/cat', async ({replyWithPhoto}) => {
      const res = await axios.get('http://thecatapi.com/api/images/get');
      const trueCatUrl = res.request.res.responseUrl;
      return replyWithPhoto(trueCatUrl);
    });

// Get weather
    bot.command('weather', async (ctx) => {
      ctx.session.isSearchWeather = true;
      return ctx.reply('Please enter city:');
    });

    bot.on('text', async ctx => {
      if (!ctx.session.isSearchWeather) {
        return;
      }
      let answerPromise;

      ctx.session.isSearchWeather = false;
      await ctx.reply('Searching... ' + ctx.message.text);

      try {
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?units=metric&q=${ctx.message.text || 'Odesa'}&cnt=1&appid=${process.env.OPENWEATHER_TOKEN}`)
        const weather = response.data;
        answerPromise = await ctx.replyWithHTML(`<b>Weather: </b> ${get(weather, 'weather[0].main', '')} ${get(weather, 'weather[0].description', '')}\n` +
          `<b>Clouds: </b> ${get(weather, 'clouds.all', '')} %\n` +
          `<b>Temp: </b> ${get(weather, 'main.temp', '')} Feel like: ${get(weather, 'main.temp', '')}`);
      } catch (e) {
        answerPromise = await ctx.reply('Nothing found');
      }

      return answerPromise;
    });

    await bot.launch({ webhook: { domain: `${process.env.PRODUCTION_SERVER}/prod` }});
  } catch(err) {
    console.log(err);
    Sentry.captureException(err);
  }

  return { statusCode: 200, body: JSON.stringify({ statusCode: 200, event }) };
};
