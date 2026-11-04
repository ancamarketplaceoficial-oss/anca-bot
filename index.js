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

function getDB(){ try{return JSON.parse(fs.readFileSync(DB_FILE));}catch(e){return {};} }
function saveDB(d){ fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); }
function guardarMemoria(from, obj){
  let db = getDB(); if(Array.isArray(db)) db={};
  if(!db[from]) db[from]={};
  db[from] = {...db[from], ...obj, fecha: new Date().toISOString()};
  saveDB(db);
}

function detectarMedidas(texto){
  const t = texto.toLowerCase();
  let area=0;
  const mX = t.match(/(\d+(\.?\d+)?)\s*(?:x|\*|por)\s*(\d+(\.?\d+)?)/);
  if(mX) area=parseFloat(mX[1])*parseFloat(mX[3]);
  else{
    const m2 = t.match(/(\d+(\.?\d+)?)\s*(m2|m²|mts|metros|mt2|cuadrados|mtro)/);
    if(m2) area=parseFloat(m2[1]);
  }
  if(area>0 && area<300){
    const btu=area*FACTOR_BTU;
    let equipo="12,000 BTU"; if(btu>12000) equipo="18,000 BTU"; if(btu>18000) equipo="24,000 BTU"; if(btu>24000) equipo="36,000 BTU"; if(btu>36000) equipo="48,000 BTU";
    return {area, equipo};
  }
  return null;
}

function responderIA(texto, from){
  const t = texto.toLowerCase().trim();
  const medida = detectarMedidas(texto);
  const db = getDB();
  const mem = db[from] || {};

  if(medida){ guardarMemoria(from, {area: medida.area, equipo: medida.equipo}); return `Perfecto, para *${medida.area} m²* lo ideal es un equipo de *${medida.equipo}* para que enfríe al 100%.\n\n¿En qué zona de Managua sería la instalación? Así te paso el precio total ya instalado con protector y garantía.`; }

  // ZONA - ARREGLA BUG DE LA FOTO
  if(t.includes("managua") || t.includes("masaya") || t.includes("leon") || t.includes("granada") || t.includes("carretera") || t.includes("barrio") || t.includes("residencial") || t.includes("colonia") || t.startsWith("en ")){
    if(mem.area) return `Excelente, instalación en *${texto}* para ${mem.area} m² (${mem.equipo}).\n\nTe dejo la cotización con el asesor humano para cerrarte precio final con protector y garantía. ¿Cuántos aires son?`;
    return `Zona ${texto} anotada. ¿Qué medidas tiene el espacio? Ej: 4x4 o 20 metros.`;
  }

  // --- AHORA RESPONDE CUALQUIER PREGUNTA ---

  if(t.includes("marca") || t.includes("cual marca") || t.includes("que aire")) return `Trabajamos Midea, Confortfresh y Lennox - todas inverter, súper ahorrativas y silenciosas. Te recomiendo según medidas. ¿Qué medidas tiene tu espacio?`;
  
  if(t.includes("credito") || t.includes("cuota") || t.includes("financiado") || t.includes("credi")) return `Sí, aceptamos efectivo, transferencia, tarjeta y crédito con CrediFacil solo con tu cédula. Aprobación en 15 min. ¿Qué medidas tiene el espacio? Te cotizo en crédito también.`;
  
  if(t.includes("tarjeta") || t.includes("pago") || t.includes("transferencia")) return `Aceptamos efectivo, transferencia BAC/Lafise y tarjeta de crédito/débito. ¿Qué medidas tiene el espacio?`;
  
  if(t.includes("garantia") || t.includes("protector")) return `Todo equipo nuevo lleva *1 año de garantía en instalación*, 5-10 años en compresor según marca y protector de voltaje incluido. Todo instalado. ¿Medidas del espacio?`;
  
  if(t.includes("bota agua") || t.includes("tira agua") || t.includes("gotea")) return `Si bota agua es porque necesita mantenimiento - está tapado el drenaje. Con el *General C$1,900* lo destapamos y queda como nuevo. ¿Cuánto tiempo tiene sin mantenimiento y en qué zona es?`;
  
  if(t.includes("no enfria") || t.includes("no enfría") || t.includes("no hel") || t.includes("poco frio")) return `Si no enfría puede ser falta de gas o suciedad. La revisión a domicilio cuesta C$15 que se abona si haces la reparación. ¿Cuánto tiempo tiene sin mantenimiento? ¿Qué medidas tiene el cuarto?`;
  
  if(t.includes("ruido") || t.includes("suena")) return `Si hace ruido es falta de mantenimiento en la turbina. Con un Preventivo C$1,500 o General C$1,900 se corrige. ¿Cuánto tiempo tiene sin mantenimiento?`;
  
  if(t.includes("cuanto tarda") || t.includes("instalacion") || t.includes("cuanto demora")) return `Instalación el mismo día si es en Managua, tarda 2-3 horas, te dejamos todo limpio, con garantía y protector. ¿Qué medidas tiene el espacio y en qué zona?`;
  
  if(t.includes("horario") || t.includes("hora") || t.includes("abierto")) return `Atendemos Lunes a Sábado 8am a 6pm, Domingos hasta mediodía. Instalaciones todos los días. ¿Qué medidas tiene tu espacio?`;
  
  if(t.includes("donde") || t.includes("ubicacion") || t.includes("direccion") || t.includes("taller")) return `Estamos en Managua y atendemos a domicilio en todo Managua, Masaya, Granada, León. Instalación hoy mismo. ¿En qué zona sería?`;
  
  if(t.includes("mantenimiento")){
    if(t.includes("año") || t.includes("nunca") || t.includes("mucho")) return `Si tiene más de 1 año o nunca le has dado, necesitás el *GENERAL C$1,900* - lavado químico completo. ¿Cuántos equipos y zona?`;
    if(t.includes("mes")) return `Con poco tiempo, *PREVENTIVO C$1,500* es suficiente. ¿Zona?`;
    return `Para recomendarte: *¿Cuánto tiempo tiene sin mantenimiento?*\n\nPreventivo C$1,500 (menos de 8 meses)\nGeneral C$1,900 (más de 1 año)\n\nDecime el tiempo.`;
  }

  if(t.includes("12.000") || t.includes("12000") || t.includes("no me ayuda") || t.includes("muy pequeño")){
    return `Correcto, por eso te pido medidas. Un 12k para ${mem.area || '14'} m² te queda corto y gasta más luz. Necesitas *${mem.equipo || '18,000 BTU'}* mínimo. ¿Te cotizo ese?`;
  }

  if(t === "hola" || t === "buenas" || t.length < 7){
    if(mem.area) return `Hola de nuevo! Tengo anotado ${mem.area} m² (${mem.equipo}). ¿En qué zona sería la instalación?`;
    return `Hola, bienvenido a ANCA Marketplace 💙\n\nSoy tu asesor virtual. Decime qué necesitás:\n- Precio de aire\n- Mantenimiento\n- Reparación\n\nY las medidas del espacio, ej: "4x4" o "20 metros". O escribí *asesor* para hablar con una persona.`;
  }

  if(t.includes("precio") || t.includes("cuanto cuesta") || t.includes("cotizar")){
    if(mem.area) return `Ya tengo tu medida: ${mem.area} m². ¿En qué zona de Managua sería para pasarte precio instalado?`;
    return `Con gusto te cotizo. ¿Qué medidas tiene el espacio? Ej: 4x4 o 20 metros.`;
  }

  if(t.includes("asesor") || t.includes("persona") || t.includes("humano")) return `Te paso con asesor humano ahora mismo 👨‍💼. Mientras, ¿qué medidas tiene el espacio? Así va con cotización lista.`;

  // RESPUESTA INTELIGENTE PARA CUALQUIER OTRA COSA
  return `Buena consulta. En ANCA te ayudamos con eso, trabajamos instalación, mantenimiento y reparación con garantía.\n\nPara darte el dato exacto, ¿me decís qué medidas tiene el espacio? Ej: 4x4. Y si preferís, escribí *asesor* y te atiendo yo personalmente.`;
}

app.get('/webhook', (req, res) => { if (req.query['hub.verify_token'] === VERIFY_TOKEN) return res.send(req.query['hub.challenge']); res.sendStatus(403); });
app.post('/webhook', async (req, res) => {
  try{
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if(msg){
      const from=msg.from; const text=msg.text?.body || "";
      console.log(from, text);
      const respuesta = responderIA(text, from);
      guardarMemoria(from, {ultimo: text});
      await axios.post(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, { messaging_product:"whatsapp", to:from, text:{body:respuesta} }, { headers:{Authorization:`Bearer ${ACCESS_TOKEN}`} });
    }
    res.sendStatus(200);
  }catch(e){ console.log("ERROR:", e.response?.data || e.message); res.sendStatus(200); }
});
app.get('/', (req,res)=>res.send('Bot ANCA v6 FINAL sin IA externa OK'));
app.get('/clientes', (req,res)=>{ try{res.json(getDB());}catch(e){res.json({});} });
app.listen(process.env.PORT || 3000, ()=>console.log("Bot v6 FINAL listo"));