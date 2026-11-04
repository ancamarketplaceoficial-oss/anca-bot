const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'anca2025';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const FACTOR_BTU = 1000;
const DB_FILE = './clientes.json';

function guardarCliente(from, text) {
  let data = [];
  try { data = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
  data.push({ numero: from, mensaje: text, fecha: new Date().toISOString() });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function detectarMedidas(texto) {
  const t = texto.toLowerCase();
  let area = 0;
  const matchX = t.match(/(\d+(\.?\d+)?)\s*(?:x|\*|por)\s*(\d+(\.?\d+)?)/);
  if (matchX) area = parseFloat(matchX[1]) * parseFloat(matchX[3]);
  else {
    const matchM2 = t.match(/(\d+(\.?\d+)?)\s*(m2|m²|mts|metros|mt2|cuadrados)/);
    if (matchM2) area = parseFloat(matchM2[1]);
  }
  if (area > 0) {
    const btu = area * FACTOR_BTU;
    let equipo = "12,000 BTU";
    if (btu > 12000) equipo = "18,000 BTU";
    if (btu > 18000) equipo = "24,000 BTU";
    if (btu > 24000) equipo = "36,000 BTU";
    if (btu > 36000) equipo = "48,000 BTU";
    if (btu > 48000) equipo = "60,000 BTU";
    return { area, equipo };
  }
  return null;
}

function responderIA(texto) {
  const t = texto.toLowerCase().trim();
  const medida = detectarMedidas(texto);

  // --- LOGICA DE MANTENIMIENTO CON TIEMPO Y PRECIOS REALES ---
  if (t.includes("mantenimiento") || t.includes("limpieza") || t.includes("manto")) {
    
    // Si ya dijo tiempo, cotiza directo
    if (t.includes("año") || t.includes("años") || t.includes("mucho") || t.includes("nunca") || t.match(/\d+\s*años?/)) {
        return `Perfecto, si tiene más de un año sin mantenimiento o nunca le has dado, te recomiendo el *MANTENIMIENTO GENERAL*.

*GENERAL - C$1,900 córdobas*
Incluye desmontaje completo, lavado químico profundo de evaporador y condensador, limpieza de turbina, revisión de gas y sistema eléctrico. Queda como nuevo.

Si lo querés agendar, decime cuántos aires son y en qué zona de Managua.`;
    }
    if (t.includes("6 meses") || t.includes("poco") || t.includes("mes") || t.includes("reciente")) {
        return `Si tiene poco tiempo (menos de 8 meses), con el *PREVENTIVO* es suficiente.

*PREVENTIVO - C$1,500 córdobas*
Incluye limpieza de filtros, evaporador, condensador, revisión de gas y presión.

¿En qué dirección sería y cuántos equipos?`;
    }

    // Si NO dijo tiempo, PREGUNTA
    return `Claro, servicio de mantenimiento ANCA 💙

Una pregunta importante para recomendarte el correcto: *¿Cuánto tiempo tiene tu aire sin recibir mantenimiento?*

- ¿Menos de 6 meses?
- ¿Más de 1 año?
- ¿Nunca le has dado?

Te cuento, tenemos:
*Preventivo: C$1,500* (mantenimiento regular)
*General: C$1,900* (cuando tiene mucho tiempo sin limpieza o está tirando poco aire)

Decime el tiempo y te digo cuál necesitas.`;
  }

  // VENTA NORMAL CON MEDIDAS
  if (medida) {
    return `Para un espacio de *${medida.area} m²*, lo ideal para que enfríe perfecto es uno de *${medida.equipo}*.

¿Te preparo la cotización ya instalada con protector y garantía?

Solo necesito la zona donde sería la instalación.`;
  }

  if (t.includes("precio") || t.includes("cotizar") || t.includes("1")) {
    return `Con gusto te cotizo.

Para darte el equipo exacto, ¿qué medidas tiene el espacio? Ej: "4x4" o "30 metros".`;
  }

  if (t.includes("instalacion") || t.includes("2")) {
    return `Para instalación, decime las medidas del espacio (ej: 5x4) y la dirección. Te paso el costo total instalado.`;
  }

  if (t.includes("reparacion") || t.includes("4")) {
    return `Te ayudo con reparación. Decime qué falla tiene (no enfría, bota agua, etc) y cuánto tiempo tiene sin mantenimiento.`;
  }

  return `Hola, bienvenido a ANCA Marketplace 💙

Decime qué necesitás y las medidas del espacio. Ej: "cotizar aire para 4x4" o "mantenimiento".

O escribí *asesor* para atención personal.`;
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

app.get('/', (req,res)=>res.send('Bot ANCA v4 Mantenimiento C$ OK'));
app.listen(process.env.PORT || 3000, ()=>console.log("Bot v4 listo"));
