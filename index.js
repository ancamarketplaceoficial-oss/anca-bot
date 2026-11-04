const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'anca2025';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;

// --- CONFIGURACION DE LA FORMULA ---
// Cambia 800 por 1000 si lo querés más exacto para que nunca quede corto
const FACTOR_BTU = 800; 
const DB_FILE = './clientes.json';

function guardarCliente(from, text) {
  let data = [];
  try { data = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
  data.push({ numero: from, mensaje: text, fecha: new Date().toISOString() });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function calcularBTU(texto) {
  const t = texto.toLowerCase();
  let area = 0;

  // Busca patrones tipo 4x4, 4 x 4, 4m x 5m
  const matchX = t.match(/(\d+(\.\d+)?)\s*(?:x|\*)\s*(\d+(\.\d+)?)/);
  if (matchX) {
    area = parseFloat(matchX[1]) * parseFloat(matchX[3]);
  } else {
    // Busca "20 metros", "20 m2", "20m2"
    const matchM2 = t.match(/(\d+(\.\d+)?)\s*(m2|mts|metros|mt2)/);
    if (matchM2) area = parseFloat(matchM2[1]);
  }

  if (area > 0) {
    const btuExacto = area * FACTOR_BTU;
    let equipoRecomendado = "12,000 BTU";
    if (btuExacto > 12000) equipoRecomendado = "18,000 BTU";
    if (btuExacto > 18000) equipoRecomendado = "24,000 BTU";
    if (btuExacto > 24000) equipoRecomendado = "36,000 BTU";
    if (btuExacto > 36000) equipoRecomendado = "48,000 - 60,000 BTU";

    return { area, btuExacto, equipoRecomendado };
  }
  return null;
}

function responderIA(texto) {
  const t = texto.toLowerCase().trim();
  const calculo = calcularBTU(texto);

  // Si detectó medidas, hace el cálculo exacto
  if (calculo) {
    return `*Cálculo exacto ANCA* 📐

Vos me diste: ${calculo.area} m²
Fórmula: ${calculo.area} m² x ${FACTOR_BTU} = *${calculo.btuExacto.toLocaleString()} BTU*

Para que no tengas problemas y enfríe perfecto, te recomiendo un equipo de *${calculo.equipoRecomendado}*.

¿Querés que te cotice ese de ${calculo.equipoRecomendado} ya instalado con protector y garantía?

Escribí *1* para ver precios, *2* para instalación, *5* para asesor de ventas.`;
  }

  if (t === "1" || t.includes("precio")) {
    return `*ANCA - Para cotizarte exacto* 💙

¿Que medidas exactas deseas climatizar? 
Decime por ejemplo: "4x4" o "20 metros cuadrados"

Yo te hago la cuenta exacta: m² x ${FACTOR_BTU} = BTU necesarios.

Así no te queda pequeño y no gastas de más.`;
  }
  if (t === "2") return `*Instalación* 🔧 ¿Que medidas tiene el area? Ej: 4x4. Te calculo el BTU exacto y te cotizo instalado.`;
  if (t === "3") return `*Mantenimiento* ✨ ¿Que medidas tiene el area donde esta el aire? Así veo que equipo es y te cotizo mantenimiento preventivo o general.`;
  if (t === "4") return `*Reparación* 🛠️ ¿Que problema tiene y que medidas tiene el cuarto donde está? Te calculo y agendamos revisión $15.`;
  if (t === "5") return `*Asesor de ventas* 👨‍💼 Perfecto, decime las medidas exactas (ej: 5x4) y te paso con asesor con la cotización ya calculada.`;

  return `*Hola! Soy el asistente de ANCA* 💙🧊

¿En qué te ayudo?

*1* - Precios y capacidades
*2* - Cotizar instalación
*3* - Mantenimiento
*4* - Reparación
*5* - Asesor de ventas

*IMPORTANTE:* Decime siempre las medidas exactas del espacio, ej: "mi sala mide 4x5" y yo te calculo los BTU exactos con la fórmula ${FACTOR_BTU}.`;
}

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) return res.send(req.query['hub.challenge']);
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (msg) {
      const from = msg.from;
      const text = msg.text?.body || "";
      guardarCliente(from, text);
      const respuesta = responderIA(text);
      await axios.post(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
        messaging_product: "whatsapp", to: from, text: { body: respuesta },
      }, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } });
    }
    res.sendStatus(200);
  } catch(e){ console.log("ERROR:", e.response?.data || e.message); res.sendStatus(200); }
});

app.get('/', (req,res)=>res.send('Bot ANCA con formula m2 x '+FACTOR_BTU+' OK'));
app.listen(process.env.PORT || 3000, ()=>console.log("Bot ANCA con formula listo"));
