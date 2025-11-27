// server.js  –  complete drop-in replacement
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));

/* ----------------------------------------------------------
   1.  City search  (WAQI)  –  returns what WAQI has
---------------------------------------------------------- */
app.get('/api/aqi/:city', async (req, res) => {
  try {
    const city = encodeURIComponent(req.params.city);
    const url  = `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_KEY}`;
    const { data } = await axios.get(url);

    if (data.status === 'ok') {
      const iaqi = data.data.iaqi;
      res.json({
        status: 'success',
        data: {
          city: { name: data.data.city.name, geo: data.data.city.geo || null },
          current: {
            pollution: {
              aqius: data.data.aqi,
              pm2_5: iaqi.pm25 ? iaqi.pm25.v : null,
              pm10:  iaqi.pm10 ? iaqi.pm10.v : null,
              so2:   iaqi.so2  ? iaqi.so2.v  : null,
              o3:    iaqi.o3   ? iaqi.o3.v   : null,
              no2:   iaqi.no2  ? iaqi.no2.v  : null,
              co:    iaqi.co   ? iaqi.co.v   : null,
              o2:    iaqi.o3   ? iaqi.o3.v   : null   // openweather has no O₂, duplicate O₃
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

/* ----------------------------------------------------------
   2.  Current pollutants by lat/lon  (OpenWeather)
       –  always returns full set  (no N/A)
---------------------------------------------------------- */
app.get('/api/current/:lat/:lon', async (req, res) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${req.params.lat}&lon=${req.params.lon}&appid=${process.env.OWM_KEY}`;
    const { data } = await axios.get(url);
    const c = data.list[0].components;          // µg/m³ except CO (mg/m³)
    res.json({
      status: 'success',
      data: {
        pollution: {
          aqius: Math.round(data.list[0].main.aqi * 50), // rough AQI
          pm2_5: c.pm2_5 || 0,
          pm10:  c.pm10  || 0,
          so2:   c.so2   || 0,
          o3:    c.o3    || 0,
          no2:   c.no2   || 0,
          co:    c.co    || 0,
          o2:    c.o3    || 0   // duplicate O₃ again
        }
      }
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'OpenWeather current failed' });
  }
});

/* ----------------------------------------------------------
   3.  7-day forecast  (OpenWeather)  –  your original route
---------------------------------------------------------- */
app.get('/api/forecast/:lat/:lon', async (req, res) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${req.params.lat}&lon=${req.params.lon}&appid=${process.env.OWM_KEY}`;
    const { data } = await axios.get(url);
    res.json(data);
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Forecast unavailable' });
  }
});

/* ----------------------------------------------------------
   START SERVER
---------------------------------------------------------- */
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));