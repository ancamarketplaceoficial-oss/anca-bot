const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'anca2025';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const sesiones = new Map();

function getMenu(nombre) {
  const n = nombre ? `, ${nombre}` : '';
  return `Mucho gusto${n} 💙 Bienvenido a ANCA Marketplace.\nSoy tu asesor virtual. ¿Cómo te ayudo hoy?\n\n*1* - Precio de aire / Cotización\n*2* - Mantenimiento\n*3* - Reparación\n*4* - Garantía de aire\n*5* - Hablar con asesor\n\nPodés poner el número *o* escribirme libre, como "mi aire bota agua"`;
}

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

// --- IA GRATIS CON GEMINI ---
async function responderConIA(texto, sesion) {
  if (!GEMINI_KEY) return null;
  try {
    const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      contents: [{
        parts: [{ text: `Eres asesor profesional de ANCA Marketplace Managua. Cliente: ${sesion.nombre || 'sin nombre'}, zona: ${sesion.zona || 'sin zona'}, area: ${sesion.area || ''}. Vendes, instalas, reparas, mantenimiento. Precios: Preventivo C$1500, General C$1900. Garantía instalación 1 año, compresor 5-10 años, protector incluido. Horario Lun-Sab 8am-6pm. Pagos efectivo, transferencia, tarjeta. Responde corto, profesional, cálido, español nicaragüense, llamalo por su nombre. Si pregunta precio de equipo, pide medidas, no inventes precio. Pregunta del cliente: ${texto}` }]
      }]
    });
    return res.data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch(e){ console.log("Error Gemini:", e.response?.data || e.message); return null; }
}

async function procesar(from, textoOriginal) {
  const t = textoOriginal.toLowerCase().trim();
  let s = sesiones.get(from) || { paso: 'pedir_nombre', nombre: null, area: null, equipo: null, zona: null, tema: null };

  if (s.paso === 'pedir_nombre') {
    if (t === 'hola' || t === 'buenas' || t === 'hello' || t === 'menu' || t === 'inicio') {
      sesiones.set(from, s);
      return `Hola, bienvenido a ANCA Marketplace 💙\n\nSoy tu asesor virtual. Antes de ayudarte, ¿cómo te llamás? Así te atiendo personalizado.`;
    }
    let nombre = textoOriginal.trim().replace(/^(soy|me llamo|mi nombre es)\s+/i, '').split(',')[0].split('-')[0].trim();
    if (nombre.length < 2 || /^\d+$/.test(nombre)) return `¿Cómo te llamás? Decime tu nombre para atenderte mejor.`;
    s.nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
    s.paso = 'menu'; sesiones.set(from, s);
    return getMenu(s.nombre);
  }

  if (t === 'menu') { s.paso = 'menu'; sesiones.set(from, s); return getMenu(s.nombre); }
  if (t === 'hola' || t === 'buenas') {
    if (s.paso !== 'menu' && s.paso !== 'pedir_nombre') return `Hola de nuevo ${s.nombre || ''}! Seguimos donde quedamos. ¿En qué te ayudo?`;
    return getMenu(s.nombre);
  }

  let opcion = null;
  if (t === '1' || t.includes('precio') || t.includes('cotiz') || t.includes('cuanto cuesta')) opcion = '1';
  if (t === '2' || t.includes('mantenimiento') || t.includes('limpieza')) opcion = '2';
  if (t === '3' || t.includes('repar') || t.includes('no enfr') || t.includes('bota agua') || t.includes('ruido') || t.includes('dañ')) opcion = '3';
  if (t === '4' || t.includes('garant')) opcion = '4';
  if (t === '5' || t.includes('asesor') || t.includes('humano') || t.includes('persona')) opcion = '5';

  if (opcion) {
    s.tema = opcion;
    if (opcion === '1') { s.paso = 'esperando_medidas'; sesiones.set(from, s); return `Con gusto ${s.nombre}, te cotizo. ¿Qué medidas tiene el espacio? Ej: 4x4 o 20 metros.`; }
    if (opcion === '2') { s.paso = 'mantenimiento_tiempo'; sesiones.set(from, s); return `Perfecto ${s.nombre}. Para recomendarte bien: *¿Cuánto tiempo tiene tu aire sin mantenimiento?* ¿Meses, más de un año, o nunca?\n\n*Preventivo: C$1,500*\n*General: C$1,900*`; }
    if (opcion === '3') { s.paso = 'reparacion_detalle'; sesiones.set(from, s); return `Te ayudo con eso ${s.nombre}. Decime: ¿Qué le pasa al aire? ¿No enfría, bota agua, hace ruido, no enciende?`; }
    if (opcion === '4') { s.paso = 'garantia_detalle'; sesiones.set(from, s); return `*Garantía ANCA* 💙 ${s.nombre}\n\n✅ Instalación: 1 año\n✅ Compresor: 5 a 10 años según marca\n✅ Protector de voltaje incluido\n\nSi fue instalado por nosotros y tiene falla, lo cubrimos sin costo.\n\nDecime: ¿Cuándo lo instalamos y qué falla tiene?`; }
    if (opcion === '5') { s.paso = 'asesor_final'; sesiones.set(from, s); return `Perfecto ${s.nombre}, te paso con asesor humano ahora mismo 👨‍💼. ¿En qué zona estás para que te atienda?`; }
  }

  if (s.paso === 'esperando_medidas') {
    const med = detectarMedidas(textoOriginal);
    if (med) {
      s.area = med.area; s.equipo = med.equipo; s.paso = 'esperando_zona'; sesiones.set(from, s);
      return `Perfecto ${s.nombre}, para ${med.area} m² lo ideal es un equipo de *${med.equipo}*.\n\n¿En qué zona de Managua sería la instalación?`;
    }
    return `${s.nombre}, no te entendí las medidas. Decime como "4x4" o "20 metros".`;
  }

  if (s.paso === 'esperando_zona') {
    s.zona = textoOriginal; s.paso = 'cotizacion_lista'; sesiones.set(from, s);
    return `Excelente ${s.nombre}, instalación en *${textoOriginal}* para ${s.area} m² (${s.equipo}).\n\nTe dejo la cotización con el asesor humano para cerrarte precio final con protector y garantía. ¿Cuántos aires son?`;
  }

  if (s.paso === 'cotizacion_lista') {
    s.paso = 'asesor_final'; sesiones.set(from, s);
    return `Listo ${s.nombre}, anotado. Te paso con asesor para cerrarte todo. ¿Querés que te llame o seguimos por aquí?`;
  }

  if (s.paso === 'mantenimiento_tiempo') {
    if (t.includes('año') || t.includes('nunca') || t.includes('mucho')) { s.paso='mantenimiento_zona'; sesiones.set(from,s); return `Si tiene más de un año ${s.nombre}, te recomiendo el *GENERAL en C$1,900*. Queda como nuevo. ¿En qué zona sería y cuántos aires son?`; }
    if (t.includes('mes')) { s.paso='mantenimiento_zona'; sesiones.set(from,s); return `Con el *PREVENTIVO en C$1,500* es suficiente ${s.nombre}. ¿En qué zona sería?`; }
    return `${s.nombre}, ¿tiene meses, más de un año, o nunca le han hecho?`;
  }

  if (s.paso === 'mantenimiento_zona' || s.paso === 'reparacion_detalle' || s.paso === 'garantia_detalle' || s.paso === 'asesor_final') {
    if (!s.zona) s.zona = textoOriginal;
    s.paso = 'cerrado'; sesiones.set(from, s);
    return `Perfecto ${s.nombre}, ya lo anoté todo ✅\n\n📍 Zona: ${s.zona}\n${s.area ? `📐 Espacio: ${s.area} m² (${s.equipo})\n` : ''}Te paso con asesor humano para agendarte y confirmarte precio final. En un momento te escriben.\n\nSi necesitás algo más, escribí *menu*.`;
  }

  if (s.paso === 'cerrado') {
    if (t.includes('gracias')) return `Con gusto ${s.nombre} 💙 Quedamos atentos.`;
    s.paso = 'menu'; sesiones.set(from, s);
    return getMenu(s.nombre);
  }

  const ia = await responderConIA(textoOriginal, s);
  if (ia) return ia;
  return `${s.nombre}, te ayudo con eso. Escribí *menu* para ver las opciones.`;
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

app.get('/', (req,res)=>res.send('Bot ANCA v8 Gemini Gratis OK'));
app.listen(process.env.PORT || 3000, ()=>console.log("Bot v8 lista"));
