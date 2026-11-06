// ANCA MARKETPLACE - BOT v12 FINAL - TODO EN UNO + FOTOS
// Menú + Precios + SEER + Voltaje + Instalación + Garantía + Fotos por Tipo + IA

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const TOKEN = process.env.ACCESS_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY = process.env.VERIFY_TOKEN || 'anca123';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const sessions = new Map();

// ===== FOTOS POR TIPO - PEGA AQUI TUS LINKS =====
// Sube tus 4 fotos a postimages.org y pega el link directo aquí
const FOTOS = {
  // Foto 1 que me mandaste - GPLUS Split Pared Inverter
  split_gplus: 'PEGA_AQUI_TU_LINK_FOTO_1_GPLUS_SPLIT',
  // Foto 2 que me mandaste - GPLUS Piso-Techo 60K
  piso_techo_60k: 'PEGA_AQUI_TU_LINK_FOTO_2_PISO_TECHO',
  // Foto 3 que me mandaste - LG Dual Inverter
  split_lg: 'PEGA_AQUI_TU_LINK_FOTO_3_LG',
  // Foto 4 que me mandaste - GBR Inverter Split
  split_gbr: 'PEGA_AQUI_TU_LINK_FOTO_4_GBR',
  // Para los demás tipos usamos la misma de split por marca
  ventana: 'PEGA_AQUI_TU_LINK_FOTO_1_GPLUS_SPLIT',
  portatil: 'PEGA_AQUI_TU_LINK_FOTO_1_GPLUS_SPLIT',
  cassette: 'PEGA_AQUI_TU_LINK_FOTO_2_PISO_TECHO',
};

// ===== PRECIOS REALES DE TU EXCEL =====
const PRECIOS = [
  { btu: 12000, nombre:'GPLUS Portátil 12K GP-P12AO 110V C/WIFI', volt:110, tipo:'Portátil', marca:'GPLUS', seer:'', solo:12825, conInst:12825, foto:'portatil' },
  { btu: 6000, nombre:'GPLUS Ventana 6000 BTU GP-W061MS 110V', volt:110, tipo:'Ventana', marca:'GPLUS', seer:'', solo:6210, conInst:6210, foto:'ventana' },
  { btu: 12000, nombre:'GPLUS Ventana 12K GP-W121MC 110V C/CONTROL', volt:110, tipo:'Ventana', marca:'GPLUS', seer:'', solo:12825, conInst:12825, foto:'ventana' },
  { btu: 12000, nombre:'GPLUS Split 12K GP-S121C 110V Blanco', volt:110, tipo:'Split Pared', marca:'GPLUS', seer:'', solo:11475, conInst:15275, foto:'split_gplus' },
  { btu: 12000, nombre:'GPLUS Split 12K GP-S122C Blanco 220V', volt:220, tipo:'Split Pared', marca:'GPLUS', seer:'', solo:10395, conInst:14195, foto:'split_gplus' },
  { btu: 18000, nombre:'GPLUS Split 18K GP-S182C 220V Blanco', volt:220, tipo:'Split Pared', marca:'GPLUS', seer:'', solo:18900, conInst:22700, foto:'split_gplus' },
  { btu: 24000, nombre:'GPLUS Split 24K GP-S242C 220V Blanco', volt:220, tipo:'Split Pared', marca:'GPLUS', seer:'', solo:22950, conInst:28550, foto:'split_gplus' },
  { btu: 36000, nombre:'GPLUS Split 36K GP-S362C 220V Blanco', volt:220, tipo:'Split Pared', marca:'GPLUS', seer:'', solo:35100, conInst:42600, foto:'split_gplus' },
  { btu: 60000, nombre:'GPLUS Piso-Techo 60K GP-60PT 220V Blanco', volt:220, tipo:'Piso-Techo', marca:'GPLUS', seer:'', solo:67500, conInst:82300, foto:'piso_techo_60k' },
  { btu: 12000, nombre:'GPLUS Split Inverter 12K GP-S12000INV 220V Blanco', volt:220, tipo:'Split Pared', marca:'GPLUS', seer:'', solo:13230, conInst:17030, foto:'split_gplus' },
  { btu: 18000, nombre:'GPLUS Split Inverter 18K GP-S18000INV 220V Blanco', volt:220, tipo:'Split Pared', marca:'GPLUS', seer:'', solo:21060, conInst:24860, foto:'split_gplus' },
  { btu: 24000, nombre:'GPLUS Split Inverter 24K GP-S24000INV 220V Blanco', volt:220, tipo:'Split Pared', marca:'GPLUS', seer:'', solo:25650, conInst:31250, foto:'split_gplus' },
  { btu: 36000, nombre:'GPLUS Split Inverter 36K GP-S36000INV 220V Blanco', volt:220, tipo:'Split Pared', marca:'GPLUS', seer:'', solo:41850, conInst:49350, foto:'split_gplus' },
  { btu: 60000, nombre:'GPLUS Piso-Techo Inverter 60K GP-60PTINV 220V Blanco', volt:220, tipo:'Piso-Techo', marca:'GPLUS', seer:'', solo:72900, conInst:87700, foto:'piso_techo_60k' },
  { btu: 60000, nombre:'GPLUS Cassette Inverter 60K GP-60CTINV 220V Blanco', volt:220, tipo:'Cassette', marca:'GPLUS', seer:'', solo:88425, conInst:103225, foto:'cassette' },
  { btu: 12000, nombre:'LG Split Inverter 12K VX121C1 110V', volt:110, tipo:'Split Pared', marca:'LG', seer:'', solo:18225, conInst:22025, foto:'split_lg' },
  { btu: 12000, nombre:'HISENSE Básico 12K AC122CE 220V (ESTANDAR) - SEER 14', volt:220, tipo:'Split Pared', marca:'HISENSE', seer:'SEER 14', solo:10395, conInst:14195, foto:'split_gplus' },
  { btu: 12000, nombre:'HISENSE Inverter 12K ATR121KA 110V - SEER 18', volt:110, tipo:'Split Pared', marca:'HISENSE', seer:'SEER 18', solo:14715, conInst:18515, foto:'split_gplus' },
  { btu: 12000, nombre:'HISENSE Inverter 12K ATR122CJ 220V - SEER 18', volt:220, tipo:'Split Pared', marca:'HISENSE', seer:'SEER 18', solo:13230, conInst:17030, foto:'split_gplus' },
  { btu: 18000, nombre:'HISENSE Inverter 18K ATR182CJ - SEER 18', volt:220, tipo:'Split Pared', marca:'HISENSE', seer:'SEER 18', solo:21060, conInst:24860, foto:'split_gplus' },
  { btu: 24000, nombre:'HISENSE Inverter 24K ATR242CJ - SEER 18', volt:220, tipo:'Split Pared', marca:'HISENSE', seer:'SEER 18', solo:25650, conInst:31250, foto:'split_gplus' },
];

function formatC(n){ return 'C$' + n.toLocaleString('en-US'); }
function recomendarBTU(m2){
  if(m2 <= 18) return 12000;
  if(m2 <= 25) return 18000;
  if(m2 <= 35) return 24000;
  if(m2 <= 50) return 36000;
  return 60000;
}

function cotizar(btu, volt, conInst){
  let lista = PRECIOS.filter(p => p.btu === btu && p.volt === volt);
  if(!lista.length) lista = PRECIOS.filter(p => p.btu === btu);
  let txt = `Para *${btu.toLocaleString()} BTU - ${volt}V* tenemos:\n\n`;
  lista.forEach(p => {
    const precio = conInst ? p.conInst : p.solo;
    const seerTxt = p.seer ? ` - ${p.seer}` : '';
    const tipoTxt = p.tipo === 'Split Pared' && p.nombre.includes('Inverter') ? '✅ Inverter Split Pared' : p.tipo;
    txt += `• ${p.nombre}\n  ${tipoTxt}${seerTxt}\n  ${formatC(precio)}${conInst && p.conInst!==p.solo ? ' (con instalación)' : ' (solo equipo)'}\n`;
    if(p.nombre.includes('Inverter') && conInst) txt += `  🎁 Incluye protector de voltaje de cortesía\n`;
    if(p.tipo==='Portátil' || p.tipo==='Ventana') txt += `  No requiere instalación\n`;
    txt += `\n`;
  });
  if(conInst){
    txt += `*Precio con instalación incluye:*\n• Servicio de instalación básica\n• Material de fijación\n• Sellado\n• Base de la unidad condensadora\n• Protector de voltaje de cortesía\n\n`;
  }
  txt += `*Garantía:* 18 meses en compresor y 1 año en partes del equipo\n`;
  txt += `*Envío:* Hasta la puerta de su casa en Managua 🏠\n\n`;
  txt += `¿Cuál le interesa? Le apartamos el equipo.`;
  return { texto: txt, lista };
}

async function enviar(to, texto){
  await axios.post(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, { messaging_product:'whatsapp', to, type:'text', text:{ body:texto } }, { headers:{ Authorization:`Bearer ${TOKEN}` } });
}

// NUEVO - Enviar foto por tipo
async function enviarFoto(to, fotoKey, caption){
  const link = FOTOS[fotoKey];
  if(!link || link.includes('PEGA_AQUI')) return; // Si no pusiste link, no falla, solo manda texto
  try{
    await axios.post(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      messaging_product:'whatsapp', to, type:'image',
      image:{ link, caption: caption || 'ANCA Marketplace 💙' }
    }, { headers:{ Authorization:`Bearer ${TOKEN}` } });
  }catch(e){ console.log('Error foto', e.response?.data); }
}

async function preguntarGemini(prompt){
  if(!GEMINI_KEY) return null;
  try{
    const r = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, { contents:[{ parts:[{ text:prompt }] }] });
    return r.data.candidates?.[0]?.content?.parts?.[0]?.text;
  }catch(e){ return null; }
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
    if(!s){ s = { paso:'nombre', nombre:'', opcion:'', m2:0, btu:0, volt:0, zona:'' }; sessions.set(from, s); }

    // DETECCIÓN DIRECTA POR MARCA / TIPO - Si dice LG, Gplus 18K, piso techo, etc.
    // Esto hace que aunque no esté en menú, le mande la foto correcta
    if(s.paso==='menu' || s.paso==='menu_final'){
      if(texto.includes('lg')){
        await enviarFoto(from, 'split_lg', 'LG Split Inverter 12K VX121C1 110V - ANCA Marketplace 💙\nSolo equipo C$18,225 / Con instalación C$22,025\nGarantía 18 meses compresor, 1 año partes. Envío hasta su casa en Managua 🏠');
        await enviar(from, `Este es el *LG Split Inverter 12K* que tenemos 💙\n\nSolo equipo: *C$18,225*\nCon instalación: *C$22,025*\n\n*Instalación incluye:* básica, fijación, sellado, base y protector de cortesía.\n\n¿Le apartamos este equipo? Escriba *Sí, lo quiero*`);
        s.paso='confirmar'; s.btu=12000; s.volt=110; s.opcion='con_inst'; return;
      }
      if(texto.includes('piso techo') || texto.includes('piso-techo') || texto.includes('60k') || texto.includes('60000')){
        await enviarFoto(from, 'piso_techo_60k', 'GPLUS Piso-Techo 60K - ANCA Marketplace 💙');
        await enviar(from, `Este es el *Piso-Techo 60,000 BTU* 💙\n\nGPLUS Piso-Techo 60K: Solo *C$67,500* / Con instalación *C$82,300*\nGPLUS Piso-Techo Inverter 60K: Solo *C$72,900* / Con instalación *C$87,700*\n\nIncluye instalación básica, fijación, sellado, base y protector.\n\n¿Le apartamos uno?`);
        s.paso='confirmar'; s.btu=60000; s.volt=220; return;
      }
      if(texto.includes('18') && texto.includes('gplus')){
        await enviarFoto(from, 'split_gplus', 'GPLUS Split Pared 18,000 BTU - ANCA Marketplace 💙');
        await enviar(from, `Este es el *GPLUS Split Pared 18,000 BTU* 💙\n\nConvencional: Solo *C$18,900* / Con instalación *C$22,700*\nInverter: Solo *C$21,060* / Con instalación *C$24,860*\n\n¿Le interesa Convencional o Inverter?`);
        s.paso='confirmar'; s.btu=18000; return;
      }
    }

    if(['hola','menu','menú','inicio','buenas'].includes(texto)){
      s.paso='nombre';
      await enviar(from, `Bienvenido a ANCA Marketplace 💙\n¿Me indica su nombre para atenderle de forma personalizada?`);
      return;
    }
    if(s.paso==='nombre'){
      s.nombre = textoOriginal.split(' ')[0]; s.paso='menu';
      await enviar(from, menuPrincipal(s.nombre)); return;
    }

    const quiereSolo = texto.includes('sin instal') || texto.includes('solo equipo') || texto.includes('solo el aire') || texto.includes('solo aire') || texto.includes('sin instalar') || texto==='2';
    const quiereCon = texto.includes('con instal') || texto.includes('instalado') || texto==='1';

    if(s.paso==='menu'){
      if(texto==='1' || quiereCon){ s.opcion='con_inst'; s.paso='medidas'; await enviar(from, `Perfecto ${s.nombre}, le ayudamos con *Suministro e Instalación* 💙\n\n¿Me indica las medidas de su cuarto? Por ejemplo *3x3* o *4x4*`); return; }
      if(texto==='2' || quiereSolo){ s.opcion='solo_equipo'; s.paso='medidas'; await enviar(from, `Perfecto ${s.nombre}, le ayudamos con *Suministro (solo equipo)* 💙\n\n¿Me indica las medidas de su cuarto? Por ejemplo *3x3*`); return; }
      if(texto==='3'){ s.paso='mant'; await enviar(from, `Claro ${s.nombre}, para *Mantenimiento* 🛠️\n\n¿Qué le pasa a su aire? Por ejemplo: *bota agua, hace ruido, no enfría*`); return; }
      if(texto==='4'){ s.paso='garantia'; await enviar(from, `Entendido ${s.nombre}, para *Garantía por Desperfecto de Fábrica* 📋\n\n¿Me indica qué falla tiene y cuándo lo compró?`); return; }
      if(texto==='5' || texto.includes('asesor')){ s.paso='asesor'; await enviar(from, `Con gusto ${s.nombre} 💙\n\nLe conecto con un *Asesor de Ventas* de ANCA.\n\n¿Me indica su teléfono y zona para que le llamen?`); return; }
      if(texto.length>3){
        const ia = await preguntarGemini(`Eres asesor de ANCA en Nicaragua, profesional. Cliente ${s.nombre} dice: "${textoOriginal}". Responde útil en max 4 líneas, no digas "asesor humano", di "Asesor de Ventas".`);
        if(ia){ await enviar(from, ia); return; }
      }
      await enviar(from, menuPrincipal(s.nombre)); return;
    }

    if(s.paso==='medidas'){
      const m = texto.match(/(\d+)[xX*](\d+)/);
      if(m){
        s.m2 = parseInt(m[1])*parseInt(m[2]); s.btu = recomendarBTU(s.m2); s.paso='voltaje';
        await enviar(from, `Perfecto, su cuarto es de *${s.m2} m²*.\n\nLe recomendamos *${s.btu.toLocaleString()} BTU*.\n\n¿Su casa tiene voltaje *110V* o *220V*?\nEscriba *110* o *220*`);
        return;
      }
      if(quiereSolo){ s.opcion='solo_equipo'; await enviar(from, `Entendido, lo cambiamos a *Solo equipo* sin instalación 💙\n\n¿Me indica las medidas? Por ejemplo *3x3*`); return; }
      await enviar(from, `¿Me indica las medidas? Por ejemplo *3x3*`); return;
    }

    if(s.paso==='voltaje'){
      if(texto.includes('110')) s.volt=110;
      else if(texto.includes('220')) s.volt=220;
      else { await enviar(from, `¿Es *110V* o *220V*? Escriba 110 o 220`); return; }
      const conInst = s.opcion==='con_inst';
      const res = cotizar(s.btu, s.volt, conInst);
      // Manda foto del primer equipo recomendado
      if(res.lista.length>0){
        await enviarFoto(from, res.lista[0].foto, `${res.lista[0].nombre} - ANCA Marketplace 💙`);
      }
      s.paso = conInst ? 'zona_inst' : 'zona_entrega';
      await enviar(from, `${res.texto}\n\n${conInst ? '¿En qué zona sería la instalación?' : '¿En qué zona sería la entrega del equipo?'}`);
      return;
    }

    if(s.paso==='zona_inst' || s.paso==='zona_entrega'){
      if(quiereSolo){
        s.opcion='solo_equipo'; s.paso='zona_entrega';
        const res = cotizar(s.btu, s.volt, false);
        if(res.lista.length>0) await enviarFoto(from, res.lista[0].foto, res.lista[0].nombre);
        await enviar(from, `Entendido, lo dejamos en *Solo equipo* sin instalación 💙\n\n${res.texto}\n\n¿En qué zona sería la entrega?`);
        return;
      }
      s.zona = textoOriginal; s.paso='confirmar';
      const res = cotizar(s.btu, s.volt, s.opcion==='con_inst');
      await enviar(from, `Gracias ${s.nombre} 💙\n\nResumen:\n• Opción: ${s.opcion==='con_inst' ? 'Suministro e Instalación' : 'Solo equipo'}\n• Cuarto: ${s.m2} m² - ${s.btu.toLocaleString()} BTU - ${s.volt}V\n• Zona: ${s.zona}\n\n${res.texto}\n\n¿Le apartamos el equipo? Escriba *Sí, lo quiero* y un Asesor de Ventas le confirma.`);
      return;
    }

    if(s.paso==='mant'){
      const ia = await preguntarGemini(`Eres técnico de ANCA. Cliente dice: "${textoOriginal}". Da 2 causas comunes y 1 consejo. Max 5 líneas.`);
      await enviar(from, ia || `Gracias. Un Asesor de Ventas le coordina la visita. ¿Me indica zona y teléfono?`);
      s.paso='final'; return;
    }
    if(s.paso==='garantia'){
      await enviar(from, `Gracias ${s.nombre}, registramos su caso de *Garantía por Desperfecto de Fábrica* 📋\n\n¿Me indica teléfono y zona para que un Asesor de Ventas le llame?`);
      s.paso='final'; return;
    }
    if(s.paso==='confirmar' || s.paso==='final' || s.paso==='asesor'){
      if(texto.includes('si') || texto.includes('lo quiero') || texto.includes('apart')){
        await enviar(from, `¡Perfecto ${s.nombre}! 💙\n\nYa dejamos su solicitud registrada. Un *Asesor de Ventas* de ANCA le va a contactar para confirmar precio final y entrega.\n\n¿Algo más? Escriba *menu* para volver al inicio.`);
        s.paso='menu_final'; return;
      }
      const ia = await preguntarGemini(`Eres asesor ANCA. Cliente ${s.nombre} pregunta: "${textoOriginal}". Precios: 12K desde C$10,395 solo / C$14,195 con instalación. 18K desde C$18,900 / C$22,700. HISENSE Inverter SEER 18. Max 4 líneas.`);
      if(ia){ await enviar(from, ia); return; }
      await enviar(from, `Entendido. Un Asesor de Ventas le va a contactar.`); return;
    }
    if(s.paso==='menu_final'){ await enviar(from, menuPrincipal(s.nombre)); s.paso='menu'; return; }
  }catch(e){ console.log(e); }
});

app.get('/', (req,res)=> res.send('ANCA v12 OK'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('ANCA v12', PORT));
