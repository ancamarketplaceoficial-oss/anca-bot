const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'anca2025';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// Memoria por cliente para no repetir preguntas
const sesiones = new Map();

const MENU = `Hola, bienvenido a ANCA Marketplace 💙
Soy tu asesor virtual. Decime qué necesitas:

*1* - Precio de aire / Cotización
*2* - Mantenimiento
*3* - Reparación
*4* - Garantía de aire
*5* - Hablar con asesor

Podés poner el número *o* escribirme libre, como "mi aire bota agua"`;

function detectarMedidas(texto) {
  const t = texto.toLowerCase();
  let area = 0;
  const matchX = t.match(/(\d+(\.?\d+)?)\s*(?:x|\*|por)\s*(\d+(\.?\d+)?)/);
  if (matchX) area = parseFloat(matchX[1]) * parseFloat(matchX[3]);
  else {
    const m2 = t.match(/(\d+(\.?\d+)?)\s*(m2|m²|mts|metros|cuadrados)/);
    if (m2) area = parseFloat(m2[1]);
  }
  if (area > 0) {
    const btu = area * 1000;
    let equipo = "12,000 BTU"; if (btu > 12000) equipo = "18,000 BTU"; if (btu > 18000) equipo = "24,000 BTU"; if (btu > 24000) equipo = "36,000 BTU";
    return { area, equipo };
  }
  return null;
}

async function responderConIA(texto, sesion) {
  if (!OPENAI_KEY) return null;
  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `Eres asesor de ANCA Marketplace Managua. Vendes, instalas, reparas y das mantenimiento a aires. Precios: Preventivo C$1500, General C$1900. Garantía instalación 1 año, compresor 5-10 años según marca, protector incluido. Horario Lun-Sab 8am-6pm. Pagos efectivo, transferencia, tarjeta. Contexto actual del cliente: ${JSON.stringify(sesion)}. Responde corto, humano, español nicaragüense. Si pregunta precio de equipo, pide medidas, no inventes precio exacto.` },
        { role: "user", content: texto }
      ],
      max_tokens: 300
    }, { headers: { Authorization: `Bearer ${OPENAI_KEY}` } });
    return res.data.choices[0].message.content;
  } catch(e){ console.log("Error OpenAI:", e.response?.data || e.message); return null; }
}

async function procesar(from, textoOriginal) {
  const t = textoOriginal.toLowerCase().trim();
  let s = sesiones.get(from) || { paso: 'inicio', area: null, equipo: null, zona: null, tema: null };
  
  // Reiniciar
  if (t === 'menu' || t === 'inicio' || t === 'hola' && s.paso === 'inicio') {
    s.paso = 'menu'; sesiones.set(from, s);
    return MENU;
  }
  if (t === 'hola' || t === 'buenas' || t === 'hello') {
    // Si ya está en medio de cotización, no lo mandes al menú, seguí
    if (s.paso !== 'inicio' && s.paso !== 'menu') return `Hola de nuevo! Seguimos donde quedamos. ${s.area ? `Tengo anotado ${s.area} m² (${s.equipo}).` : ''} ¿En qué zona sería?`;
    s.paso = 'menu'; sesiones.set(from, s); return MENU;
  }

  // Detectar opción numérica O por palabra - OPCIONAL, las 2 sirven
  let opcion = null;
  if (t === '1' || t.includes('precio') || t.includes('cotiz') || t.includes('cuanto cuesta') || t.includes('cuánto cuesta')) opcion = '1';
  if (t === '2' || t.includes('mantenimiento') || t.includes('limpieza')) opcion = '2';
  if (t === '3' || t.includes('repar') || t.includes('no enfr') || t.includes('bota agua') || t.includes('ruido') || t.includes('dañ')) opcion = '3';
  if (t === '4' || t.includes('garant')) opcion = '4';
  if (t === '5' || t.includes('asesor') || t.includes('humano') || t.includes('persona')) opcion = '5';

  if (opcion) {
    s.tema = opcion;
    if (opcion === '1') { s.paso = 'esperando_medidas'; sesiones.set(from, s); return `Con gusto te cotizo. ¿Qué medidas tiene el espacio? Ej: 4x4 o 20 metros.`; }
    if (opcion === '2') { s.paso = 'mantenimiento_tiempo'; sesiones.set(from, s); return `Perfecto. Para recomendarte bien: *¿Cuánto tiempo tiene tu aire sin mantenimiento?* ¿Meses, más de un año, o nunca? \n\nTenemos:\n*Preventivo: C$1,500*\n*General: C$1,900*`; }
    if (opcion === '3') { s.paso = 'reparacion_detalle'; sesiones.set(from, s); return `Te ayudo con la reparación. Decime: ¿Qué le pasa al aire? ¿No enfría, bota agua, hace ruido, no enciende? Y ¿qué marca es?`; }
    if (opcion === '4') { s.paso = 'garantia_detalle'; sesiones.set(from, s); return `*Garantía ANCA* 💙\n\n✅ Instalación: 1 año\n✅ Compresor: 5 a 10 años según marca\n✅ Protector de voltaje incluido\n\nSi tu aire fue instalado por nosotros y tiene falla, lo cubrimos sin costo.\n\nDecime: ¿Cuándo lo instalamos y qué falla tiene? Si podés, mandame foto de la factura o del aire.`; }
    if (opcion === '5') { s.paso = 'asesor'; sesiones.set(from, s); return `Te paso con asesor humano ahora mismo 👨‍💼. Mientras, ¿qué medidas tiene el espacio o qué necesitas? Así llega con la info lista.`; }
  }

  // Flujo cotización con memoria
  if (s.paso === 'esperando_medidas') {
    const med = detectarMedidas(textoOriginal);
    if (med) {
      s.area = med.area; s.equipo = med.equipo; s.paso = 'esperando_zona'; sesiones.set(from, s);
      return `Perfecto, para ${med.area} m² lo ideal es un equipo de *${med.equipo}* para que enfríe al 100%.\n\n¿En qué zona de Managua sería la instalación? Así te paso el precio total ya instalado con protector y garantía.`;
    }
    return `No te entendí las medidas. Decime como "4x4" o "20 metros".`;
  }

  if (s.paso === 'esperando_zona') {
    s.zona = textoOriginal; s.paso = 'cotizacion_lista'; sesiones.set(from, s);
    return `Excelente, instalación en *${textoOriginal}* para ${s.area} m² (${s.equipo}).\n\nTe dejo la cotización con el asesor humano para cerrarte precio final con protector y garantía. ¿Cuántos aires son?`;
  }

  if (s.paso === 'cotizacion_lista') {
    s.paso = 'asesor'; sesiones.set(from, s);
    return `Listo, anotado. Te paso con asesor para cerrarte todo de una vez. ¿Querés que te llame o seguimos por aquí?`;
  }

  if (s.paso === 'mantenimiento_tiempo') {
    if (t.includes('año') || t.includes('nunca') || t.includes('mucho')) { s.paso='mantenimiento_zona'; sesiones.set(from,s); return `Si tiene más de un año, te recomiendo el *GENERAL en C$1,900*. Queda como nuevo. ¿En qué zona sería y cuántos aires son?`; }
    if (t.includes('mes')) { s.paso='mantenimiento_zona'; sesiones.set(from,s); return `Con el *PREVENTIVO en C$1,500* es suficiente. ¿En qué zona sería?`; }
    return `¿Me decís si tiene meses, más de un año, o nunca le han hecho?`;
  }

  if (s.paso === 'mantenimiento_zona' || s.paso === 'reparacion_detalle' || s.paso === 'garantia_detalle') {
    s.paso = 'asesor'; sesiones.set(from, s);
    return `Perfecto, ya lo anoté. Te paso con asesor humano para agendarte y confirmarte precio final. ¿Me confirmás tu zona y tu nombre?`;
  }

  // Si nada calzó, IA abierta
  const ia = await responderConIA(textoOriginal, s);
  if (ia) return ia + `\n\nSi querés, escribí *menu* para ver las opciones.`;

  return `Buena pregunta. Para ayudarte bien, escribí *menu* y elegí una opción, o decime las medidas del espacio como "4x4".`;
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
      const respuesta = await procesar(from, text);
      await axios.post(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
        messaging_product: "whatsapp", to: from, text: { body: respuesta },
      }, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } });
    }
    res.sendStatus(200);
  } catch(e){ console.log("ERROR:", e.response?.data || e.message); res.sendStatus(200); }
});

app.get('/', (req,res)=>res.send('Bot ANCA v6 con Menu + Memoria OK'));
app.listen(process.env.PORT || 3000, ()=>console.log("Bot v6 lista"));
