const express = require('express');
const axios = require('axios').default;
const { Telegraf } = require('telegraf');
const { Configuration, OpenAIApi } = require('openai');
const { chatGPT } = require('./utils');


// Config .env 
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Configuracion Telegraf
app.use(bot.webhookCallback('/telegram-bot'));
bot.telegram.setWebhook(`${process.env.BOT_URL}/telegram-bot`);


app.post('/telegram-bot', (req, res) => {
    res.send('Hola Mundo');
});

//COMANDOS
bot.command('test', (ctx) => {
    console.log(ctx.message);
    ctx.reply('FUNSIONAAA!!');
    ctx.replyWithDice();
});

bot.command('holi', (ctx) => {
    ctx.reply('HOLIIIII!! ❤');
});


bot.command('tiempo', async (ctx) => {
    const ciudad = ctx.message.text.substring(7).trim();

    /* const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${process.env.OWM_API_KEY}&units=metric`); */

    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${process.env.OWM_API_KEY}&units=metric`);
    const data = await response.json();

    const {
        main: { temp, temp_min, temp_max, humidity },
        coord: { lon, lat }
    } = data;

    ctx.reply(`Los datos de temperatura en ${ciudad}: 
  🌡 Actual: ${temp}
   Maxima: ${temp_max}
   Minima: ${temp_min}
   Humedad: ${humidity} `);
    ctx.replyWithLocation(lat, lon);
});

bot.command('receta', async ctx => {
    // /receta huevos, aguacate, chorizo
    const ingredientes = ctx.message.text.substring(7).trim();  //trim para eliminar los espacios en blanco


    try {
        const titulo = await chatGPT(`Dame el titulo de una receta que pueda cocinar con los siguientes ingredientes: ${ingredientes}`);

        const elaboracion = await chatGPT(`Dame la elaboracion para la receta con este titulo:${titulo}`)

        ctx.reply(titulo);
        ctx.reply(elaboracion);
    } catch (error) {
        ctx.reply('No puedo responder en estos momentos. Intentalo mas tarde.')
    }

});

bot.on('message', async ctx => {

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY
    });
    const openai = new OpenAIApi(configuration);
    const completion = await openai.createChatCompletion({
        model: "gpt-4",
        max_tokens: 100,
        messages: [
            {
                role: 'asistant', content: 'Eres un bot de telegram. Tu nombre es @AlbertoMarLorBot. Todas las respuestas las devuelves como si fueras Chiquito de la calzada',
                role: 'user',
                content: `Respondeme en menos de 100 caracteres al siguiente texto: ${ctx.message.text}`
            }]
    });

    ctx.reply(completion.data.choices[0].message.content);
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});