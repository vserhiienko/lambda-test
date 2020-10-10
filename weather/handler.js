'use strict';

const axios = require('axios')

module.exports.getWeather = async (event, context, callback) => {
  let body = JSON.parse(event.body);
  let weather = {};
  try {
    const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?units=metric&q=${body.city || 'Odesa'}&cnt=1&appid=${process.env.OPENWEATHER_TOKEN}`)
    weather = response.data;
   } catch(error) {
    callback(null, { statusCode: 500, body: JSON.stringify({ error }) })
  }

  return { statusCode: 200, body: JSON.stringify({ weather }) };
};
