// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public')); // we will create this folder later

// Real-time AQI from WAQI
app.get('/api/aqi/:city', async (req, res) => {
  try {
    const city = encodeURIComponent(req.params.city);
    const url = `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_KEY}`;
    const { data } = await axios.get(url);
    if (data.status === 'ok') {
      res.json({
        status: 'success',
        data: {
          city: { name: data.data.city.name },
          current: {
            pollution: {
              aqius: data.data.aqi,
              pm2_5: data.data.iaqi.pm25 ? data.data.iaqi.pm25.v : 'N/A'
            }
          }
        }
      });
    } else {
      res.status(404).json({ status: 'error', message: 'City not found in WAQI' });
    }
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'WAQI API error' });
  }
});

// 7-day forecast from OpenWeatherMap
app.get('/api/forecast/:lat/:lon', async (req, res) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${req.params.lat}&lon=${req.params.lon}&appid=${process.env.OWM_KEY}`;
    const { data } = await axios.get(url);
    res.json(data);
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Forecast unavailable' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));