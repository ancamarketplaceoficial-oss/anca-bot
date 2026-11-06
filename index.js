// ANCA MARKETPLACE - BOT v9 PROFESIONAL CON PRECIOS + IA
// Node 18+ - Express - WhatsApp Cloud API - Gemini Gratis

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const TOKEN = process.env.ACCESS_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY = process.env.VERIFY_TOKEN || 'anca123';
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const sessions = new Map();

// ===== LISTA DE PRECIOS REAL - DE TU EXCEL =====
const PRECIOS = [
  { btu: 6000, nombre: 'GPLUS Ventana 6,000 BTU', solo: 6210, conInst: 6210, tipo: 'Ventana' },
  { btu: 12000, nombre: 'GPLUS Split 12K 110V Blanco', solo: 11475, conInst: 15275, tipo: 'Split' },
  { btu: 12000, nombre: 'GPLUS Split 12K 220V Blanco', solo: 10395, conInst: 14195, tipo: 'Split' },
  { btu: 18000, nombre: 'GPLUS Split 18K Blanco', solo: 18900, conInst: 22700, tipo: 'Split' },
  { btu: 24000, nombre: 'GPLUS Split 24K Blanco', solo: 22950, conInst: 28550, tipo: 'Split' },
  { btu: 36000, nombre: 'GPLUS Split 36K Blanco', solo: 35100, conInst: 42600, tipo: 'Split' },
  { btu: 60000, nombre: 'GPLUS Piso-Techo 60K Blanco', solo: 67500, conInst: 82300, tipo: 'Piso-Techo' },
  { btu: 12000, nombre: 'GPLUS Split Inverter 12K', solo: 13230, conInst: 17030, tipo: 'Inverter' },
  { btu: 18000, nombre: 'GPLUS Split Inverter 18K', solo: 21060, conInst: 24860, tipo: 'Inverter' },
  { btu: 24000, nombre: 'GPLUS Split Inverter 24K', solo: 25650, conInst: 31250, tipo: 'Inverter' },
  { btu: 36000, nombre: 'GPLUS Split Inverter 36K', solo: 41850, conInst: 49350, tipo: 'Inverter' },
  { btu: 60000, nombre: 'GPLUS Piso-Techo Inverter 60K', solo: 72900, conInst: 87700, tipo: 'Inverter' },
  { btu: 60000, nombre: 'GPLUS Cassette Inverter 60K', solo: 88425, conInst: 103225, tipo: 'Cassette' },
  { btu: 12000, nombre: 'LG Split Inverter 12K 110V', solo: 18225, conInst: 22025, tipo: 'Inverter' },
  { btu: 12000, nombre: 'HISENSE Básico 12K 220V', solo: 10395, conInst: 14195, tipo: 'Básico' },
  { btu: 12000, nombre: 'HISENSE Inverter 12K 110V', solo: 14715, conInst: 18515, tipo: 'Inverter' },
  { btu: 12000, nombre: 'HISENSE Inverter 12K 220V', solo: 13230, conInst: 17030, tipo: 'Inverter' },
  { btu: 18000, nombre: 'HISENSE Inverter 18K', solo: 21060, conInst: 24860, tipo: 'Inverter' },
  { btu: 24000, nombre: 'HISENSE Inverter 24K', solo: 25650, conInst: 31250, tipo: 'Inverter' },
  { btu: 12000, nombre: 'GPLUS Portátil 12K con WiFi', solo: 12825, conInst: 12825, tipo: 'Portátil' },
  { btu: 12000, nombre: 'GPLUS Ventana 12K con Control', solo: 12825, conInst: 12825, tipo: 'Ventana' },
];

function formatC(n){ return 'C$' + n.toLocaleString('en-US'); }
function recomendarBTU(m2){
  if(m2 <= 12) return 12000;
  if(m2 <= 18) return 12000;
  if(m2 <= 25) return 18000;
  if(m2 <= 35) return 24000;
  if(m2 <= 50) return 36000;
  return 60000;
}
function cotizacionPorBTU(btu, conInstalacion){
  const lista = PRECIOS.filter(p => p.btu === btu);
  if(!lista.length) return null;
  let txt = `Para *${btu.toLocaleString()} BTU* tenemos estas opciones en stock:\n\n`;
  lista.forEach(p => {
    const precio = conInstalacion ? p.conInst : p.solo;
    const extra = conInstalacion && p.conInst !== p.solo ? ' (con instalación incluida)' : (p.tipo==='Portátil'||p.tipo==='Ventana' ? ' (no requiere instalación)' : ' (solo equipo)');
    txt += `• ${p.nombre}\n  ${formatC(precio)}${extra}\n\n`;
  });
  txt += `¿Cuál le interesa? Le puedo apartar el equipo y coordinar entrega.`;
  return txt;
}

async function enviar(to, texto){
  await axios.post(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    messaging_product: 'whatsapp', to, type: 'text', text: { body: texto }
  }, { headers: { Authorization: `Bearer ${TOKEN}` } });
}

async function preguntarGemini(prompt){
  if(!GEMINI_KEY) return null;
  try{
    const r = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    return r.data.candidates?.[0]?.content?.parts?.[0]?.text;
  }catch(e){ console.log('Gemini error', e.response?.data || e.message); return null; }
}

function menuPrincipal(nombre){
  return `Bienvenido a ANCA Marketplace 💙\n${nombre ? `Gracias, ${nombre}. ` : ''}¿En qué le puedo ayudar el día de hoy?\n\n*1* - Suministro e Instalación de Aire Acondicionado\n*2* - Suministro de Aire Acondicionado (solo equipo)\n*3* - Servicios de Mantenimiento\n*4* - Garantía por Desperfecto de Fábrica\n*5* - Hablar con Asesor de Ventas\n\nEscríbame el número de la opción, por ejemplo *1*`;
}

app.get('/webhook', (req,res)=>{
  if(req.query['hub.mode']==='subscribe' && req.query['hub.verify_token']===VERIFY) return res.send(req.query['hub.challenge']);
  res.sendStatus(403);
});

app.post('/webhook', async (req,res)=>{
  res.sendStatus(200);
  try{
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if(!msg || msg.type !== 'text') return;
    const from = msg.from;
    const textoOriginal = msg.text.body.trim();
    const texto = textoOriginal.toLowerCase();

    let s = sessions.get(from);
    if(!s){ s = { paso: 'nombre', nombre: '', opcion: '', m2: 0, btu: 0, zona: '' }; sessions.set(from, s); }

    // Reinicio
    if(['hola','menu','menú','inicio','buenas','buenos dias','buenos días'].includes(texto)){
      s.paso='nombre'; 
      await enviar(from, `Bienvenido a ANCA Marketplace 💙\n¿Me indica su nombre para atenderle de forma personalizada?`);
      return;
    }

    // Paso nombre
    if(s.paso === 'nombre'){
      s.nombre = textoOriginal.split(' ')[0];
      s.paso = 'menu';
      await enviar(from, menuPrincipal(s.nombre));
      return;
    }

    // DETECCIÓN INTELIGENTE - SIN INSTALACIÓN / SOLO EQUIPO - ANTES DE PEDIR ZONA
    const quiereSoloEquipo = texto.includes('sin instal') || texto.includes('solo equipo') || texto.includes('solo el aire') || texto.includes('solo aire') || texto.includes('sin instalar') || texto.includes('solo suministro') || texto === '2';
    const quiereConInstalacion = texto.includes('con instal') || texto.includes('instalado') || texto === '1';

    if(s.paso === 'menu'){
      if(texto === '1' || quiereConInstalacion){
        s.opcion='con_inst'; s.paso='medidas';
        await enviar(from, `Perfecto ${s.nombre}, le ayudamos con *Suministro e Instalación* 💙\n\n¿Me indica las medidas de su cuarto? Por ejemplo *3x3* o *4x4*`);
        return;
      }
      if(texto === '2' || quiereSoloEquipo){
        s.opcion='solo_equipo'; s.paso='medidas_solo';
        await enviar(from, `Perfecto ${s.nombre}, le ayudamos con *Suministro de Aire (solo equipo)* 💙\n\n¿Me indica las medidas de su cuarto? Por ejemplo *3x3* para recomendarle el equipo correcto.`);
        return;
      }
      if(texto === '3'){
        s.opcion='mantenimiento'; s.paso='mantenimiento_detalle';
        await enviar(from, `Claro ${s.nombre}, para *Mantenimiento* 🛠️\n\n¿Qué le pasa a su aire? Por ejemplo: *bota agua, hace ruido, no enfría, huele mal*`);
        return;
      }
      if(texto === '4'){
        s.opcion='garantia'; s.paso='garantia_detalle';
        await enviar(from, `Entendido ${s.nombre}, para *Garantía por Desperfecto de Fábrica* 📋\n\n¿Me indica qué falla tiene el equipo y cuándo lo compró?`);
        return;
      }
      if(texto === '5' || texto.includes('asesor') || texto.includes('ventas') || texto.includes('hablar con')){
        s.paso='asesor';
        await enviar(from, `Con gusto ${s.nombre} 💙\n\nLe conecto con un *Asesor de Ventas* de ANCA. En breve le atenderá.\n\n¿Me indica su número de teléfono y zona para que le llamen?`);
        return;
      }
      // Si escribe libre en el menú, usa IA, no lo fuerza al menú
      if(texto.length > 3){
        const ia = await preguntarGemini(`Eres asesor de ANCA Marketplace en Nicaragua, amable y profesional. Cliente ${s.nombre} dice: "${textoOriginal}". Si pregunta por aire, precio, instalación, mantenimiento o garantía, responde útil y guíalo a una opción: 1 Suministro e Instalación, 2 Solo equipo, 3 Mantenimiento, 4 Garantía, 5 Asesor de Ventas. No digas "asesor humano", di "Asesor de Ventas". No preguntes "¿Qué haces?". Responde en máximo 4 líneas y al final pregunta qué opción prefiere.`);
        if(ia){ await enviar(from, ia); return; }
        await enviar(from, menuPrincipal(s.nombre)); return;
      }
      await enviar(from, menuPrincipal(s.nombre)); return;
    }

    // MEDIDAS - CON INSTALACIÓN
    if(s.paso === 'medidas' || s.paso === 'medidas_solo'){
      const match = texto.match(/(\d+)[xX*](\d+)/);
      if(match){
        const m2 = parseInt(match[1]) * parseInt(match[2]);
        s.m2 = m2; s.btu = recomendarBTU(m2);
        const conInst = s.paso === 'medidas';
        const cot = cotizacionPorBTU(s.btu, conInst);
        s.paso = conInst ? 'zona_inst' : 'zona_entrega';
        await enviar(from, `Perfecto, su cuarto es de *${m2} m²*.\n\nLe recomendamos un equipo de *${s.btu.toLocaleString()} BTU*.\n\n${cot}\n\n${conInst ? '¿En qué zona sería la instalación?' : '¿En qué zona sería la entrega del equipo?'}`);
        return;
      }
      // Si en medidas dice "sin instalación" - CORRECCIÓN CLAVE v9
      if(quiereSoloEquipo){
        s.opcion='solo_equipo'; s.paso='medidas_solo';
        await enviar(from, `Entendido ${s.nombre}, lo cambiamos a *Solo equipo* sin instalación 💙\n\n¿Me indica las medidas de su cuarto? Por ejemplo *3x3*`);
        return;
      }
      await enviar(from, `¿Me indica las medidas? Por ejemplo *3x3* o *4x5*`);
      return;
    }

    // ZONA INSTALACIÓN / ENTREGA
    if(s.paso === 'zona_inst' || s.paso === 'zona_entrega'){
      // Si aquí dice "sin instalación", no lo toma como zona
      if(quiereSoloEquipo){
        s.opcion='solo_equipo'; s.paso='zona_entrega';
        const cot = cotizacionPorBTU(s.btu, false);
        await enviar(from, `Entendido, lo dejamos en *Solo equipo* sin instalación 💙\n\n${cot}\n\n¿En qué zona sería la entrega?`);
        return;
      }
      s.zona = textoOriginal;
      s.paso = 'confirmar';
      const conInst = s.paso === 'confirmar' && s.opcion === 'con_inst';
      const cot = cotizacionPorBTU(s.btu, s.opcion === 'con_inst');
      await enviar(from, `Gracias ${s.nombre} 💙\n\nResumen:\n• Opción: ${s.opcion === 'con_inst' ? 'Suministro e Instalación' : 'Solo equipo'}\n• Cuarto: ${s.m2} m² - Recomendado: ${s.btu.toLocaleString()} BTU\n• Zona: ${s.zona}\n\n${cot}\n\n¿Le apartamos el equipo? Escríbame *Sí, lo quiero* y un Asesor de Ventas le confirma disponibilidad y entrega.`);
      return;
    }

    if(s.paso === 'mantenimiento_detalle'){
      const ia = await preguntarGemini(`Eres técnico de ANCA Marketplace. Cliente dice su aire: "${textoOriginal}". Da 2 posibles causas comunes y 1 consejo rápido, sin diagnosticar definitivo. Dile que el mantenimiento tiene costo según revisión y que un Asesor de Ventas le coordina visita. Máximo 5 líneas, amable, profesional.`);
      await enviar(from, ia || `Gracias por el detalle. Un Asesor de Ventas le va a coordinar la visita de mantenimiento. ¿Me indica su zona y teléfono?`);
      s.paso='datos_finales'; return;
    }

    if(s.paso === 'garantia_detalle'){
      await enviar(from, `Gracias ${s.nombre}, registramos su caso de *Garantía por Desperfecto de Fábrica* 📋\n\n¿Me indica su número de teléfono y zona para que un Asesor de Ventas le llame y le pida factura / foto del equipo?`);
      s.paso='datos_finales'; return;
    }

    if(s.paso === 'confirmar' || s.paso === 'datos_finales' || s.paso === 'asesor'){
      if(texto.includes('si') || texto.includes('lo quiero') || texto.includes('apart')){
        await enviar(from, `¡Perfecto ${s.nombre}! 💙\n\nYa dejamos su solicitud registrada. Un *Asesor de Ventas* de ANCA le va a contactar para confirmar precio final, disponibilidad y fecha de entrega / instalación.\n\n¿Algo más en lo que le pueda ayudar? Escriba *menu* para volver al inicio.`);
        s.paso='menu_final'; return;
      }
      // IA para preguntas libres sobre precios
      const ia = await preguntarGemini(`Eres asesor de ANCA Marketplace. Cliente ${s.nombre} en zona ${s.zona || ''} pregunta: "${textoOriginal}". Precios reales: 12K Split desde C$10,395 solo equipo / C$14,195 con instalación. 18K desde C$18,900 / C$22,700. 24K desde C$22,950 / C$28,550. Si pregunta precio, da precio real de la tabla. No inventes. Máximo 4 líneas, termina ofreciendo apartar equipo con Asesor de Ventas.`);
      if(ia){ await enviar(from, ia); return; }
      await enviar(from, `Entendido. Un Asesor de Ventas le va a contactar. ¿Desea que le apartemos el equipo?`);
      return;
    }

    if(s.paso === 'menu_final'){
      await enviar(from, menuPrincipal(s.nombre)); s.paso='menu'; return;
    }

  }catch(e){ console.log(e); }
});

app.get('/', (req,res)=> res.send('ANCA v9 OK'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('ANCA v9 en puerto', PORT));
