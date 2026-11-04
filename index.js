const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'anca2025';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;

// --- BASE DE DATOS SIMPLE (guarda clientes en un archivo) ---
const DB_FILE = './clientes.json';
function guardarCliente(from, text) {
  let data = [];
  try { data = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
  data.push({ numero: from, mensaje: text, fecha: new Date().toISOString() });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  console.log("Cliente guardado:", from);
}

// --- CEREBRO DE ANCA (IA simple con palabras clave) ---
function responderIA(texto) {
  const t = texto.toLowerCase();
  
  if (t.includes("1") || t.includes("precio") || t.includes("cuanto") || t.includes("costo") || t.includes("btu")) {
    return `*ANCA Marketplace - Precios de Aires* ❄️

Tenemos:
• 12,000 BTU - Desde $285 (Ideal 1 cuarto)
• 18,000 BTU - Desde $395 
• 24,000 BTU - Desde $550
• Inverter - Ahorro 60% energía

¿Qué capacidad necesitas? Dime los metros de tu cuarto y te recomiendo.

Escribe *2* para instalación, *3* para hablar con asesor.`;
  }
  if (t.includes("2") || t.includes("instalacion") || t.includes("instalar")) {
    return `*Instalación ANCA* 🔧

✅ Instalación básica incluida en Managua
✅ 1 año garantía instalación
✅ Técnicos certificados
✅ Instalamos hoy mismo

¿En qué zona de Managua es? Escribe tu dirección y te cotizo.`;
  }
  if (t.includes("3") || t.includes("asesor") || t.includes("humano") || t.includes("persona")) {
    return `Perfecto, te paso con un asesor humano de ANCA 👨‍💼

Un momento y te atendemos. Mientras, cuéntame: ¿Qué aire buscas?

Horario: Lunes a Sábado 8am - 6pm
Tel: +505 8930 3261`;
  }

  // Respuesta por defecto / Menú
  return `*Hola! Soy el asistente de ANCA Marketplace* 💙🧊

¿En qué aire acondicionado te ayudo?

Escribe un número:
*1* - Ver precios y capacidades
*2* - Cotizar instalación
*3* - Hablar con asesor humano

O dime directo: "cuanto cuesta uno de 12mil btu para un cuarto"`;
}

// Webhook Verificación
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) return res.send(req.query['hub.challenge']);
  res.sendStatus(403);
});

// Recibir mensajes
app.post('/webhook', async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (msg) {
      const from = msg.from;
      const text = msg.text?.body || "";
      console.log(`Mensaje de ${from}: ${text}`);

      guardarCliente(from, text); // 3. Guarda cliente

      const respuesta = responderIA(text); // 1 y 2. Menú + IA

      await axios.post(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
        messaging_product: "whatsapp",
        to: from,
        text: { body: respuesta },
      }, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } });

      console.log("Respuesta enviada OK");
    }
    res.sendStatus(200);
  } catch(e){ 
    console.log("ERROR FB:", e.response?.data ? JSON.stringify(e.response.data) : e.message); 
    res.sendStatus(200); 
  }
});

app.get('/', (req,res)=>res.send('Bot ANCA con Menu + IA + Clientes OK'));
app.get('/clientes', (req,res)=>{ // Para ver tus clientes: anca-bot.onrender.com/clientes
  try { res.json(JSON.parse(fs.readFileSync(DB_FILE))); } catch(e){ res.json([]); }
});

app.listen(process.env.PORT || 3000, ()=>console.log("Bot ANCA PRO listo"));
