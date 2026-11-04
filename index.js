const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'anca2025';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    return res.send(req.query['hub.challenge']);
  }
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (msg) {
      const from = msg.from;
      const text = msg.text?.body || "Hola";
      await axios.post(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
        messaging_product: "whatsapp",
        to: from,
        text: { body: `Hola! Soy el bot de ANCA Marketplace 🧊\nRecibimos: "${text}"\n¿En qué aire acondicionado te ayudo?` }
      }, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } });
    }
    res.sendStatus(200);
  } catch(e){ console.log(e); res.sendStatus(200); }
});

app.get('/', (req,res)=>res.send('Bot ANCA OK'));
app.listen(process.env.PORT || 3000);
