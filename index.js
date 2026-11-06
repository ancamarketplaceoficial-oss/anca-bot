// ANCA - BOT v13 CORREGIDO - SOLO LO DE EXCEL - CON VOLVER AL MENU
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const TOKEN = process.env.ACCESS_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY = process.env.VERIFY_TOKEN || 'anca123';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const sessions = new Map();

// FOTOS - Pega tus links aquí
const FOTOS = {
  split_gplus: 'PEGA_AQUI_LINK_FOTO_1_GPLUS_SPLIT',
  piso_techo_60k: 'PEGA_AQUI_LINK_FOTO_2_PISO_TECHO',
  split_lg: 'PEGA_AQUI_LINK_FOTO_3_LG',
  split_gbr: 'PEGA_AQUI_LINK_FOTO_4_GBR',
  ventana: 'PEGA_AQUI_LINK_FOTO_1_GPLUS_SPLIT',
  portatil: 'PEGA_AQUI_LINK_FOTO_1_GPLUS_SPLIT',
  cassette: 'PEGA_AQUI_LINK_FOTO_2_PISO_TECHO',
};

// PRECIOS EXACTOS DE TU EXCEL - NO SE INVENTA NADA
const PRECIOS = [
  { btu: 12000, nombre:'GPLUS Portátil 12K GP-P12AO 110V C/WIFI', volt:110, tipo:'Portátil', seer:'', solo:12825, conInst:12825, foto:'portatil' },
  { btu: 6000, nombre:'GPLUS Ventana 6000 BTU GP-W061MS 110V', volt:110, tipo:'Ventana', seer:'', solo:6210, conInst:6210, foto:'ventana' },
  { btu: 12000, nombre:'GPLUS Ventana 12K GP-W121MC 110V C/CONTROL', volt:110, tipo:'Ventana', seer:'', solo:12825, conInst:12825, foto:'ventana' },
  { btu: 12000, nombre:'GPLUS Split 12K GP-S121C 110V Blanco', volt:110, tipo:'Split Pared', seer:'', solo:11475, conInst:15275, foto:'split_gplus' },
  { btu: 12000, nombre:'GPLUS Split 12K GP-S122C Blanco 220V', volt:220, tipo:'Split Pared', seer:'', solo:10395, conInst:14195, foto:'split_gplus' },
  { btu: 18000, nombre:'GPLUS Split 18K GP-S182C 220V Blanco', volt:220, tipo:'Split Pared', seer:'', solo:18900, conInst:22700, foto:'split_gplus' },
  { btu: 24000, nombre:'GPLUS Split 24K GP-S242C 220V Blanco', volt:220, tipo:'Split Pared', seer:'', solo:22950, conInst:28550, foto:'split_gplus' },
  { btu: 36000, nombre:'GPLUS Split 36K GP-S362C 220V Blanco', volt:220, tipo:'Split Pared', seer:'', solo:35100, conInst:42600, foto:'split_gplus' },
  { btu: 60000, nombre:'GPLUS Piso-Techo 60K GP-60PT 220V Blanco', volt:220, tipo:'Piso-Techo', seer:'', solo:67500, conInst:82300, foto:'piso_techo_60k' },
  { btu: 12000, nombre:'GPLUS Split Inverter 12K GP-S12000INV 220V Blanco', volt:220, tipo:'Inverter', seer:'', solo:13230, conInst:17030, foto:'split_gplus' },
  { btu: 18000, nombre:'GPLUS Split Inverter 18K GP-S18000INV 220V Blanco', volt:220, tipo:'Inverter', seer:'', solo:21060, conInst:24860, foto:'split_gplus' },
  { btu: 24000, nombre:'GPLUS Split Inverter 24K GP-S24000INV 220V Blanco', volt:220, tipo:'Inverter', seer:'', solo:25650, conInst:31250, foto:'split_gplus' },
  { btu: 36000, nombre:'GPLUS Split Inverter 36K GP-S36000INV 220V Blanco', volt:220, tipo:'Inverter', seer:'', solo:41850, conInst:49350, foto:'split_gplus' },
  { btu: 60000, nombre:'GPLUS Piso-Techo Inverter 60K GP-60PTINV 220V Blanco', volt:220, tipo:'Piso-Techo', seer:'', solo:72900, conInst:87700, foto:'piso_techo_60k' },
  { btu: 60000, nombre:'GPLUS Cassette Inverter 60K GP-60CTINV 220V Blanco', volt:220, tipo:'Cassette', seer:'', solo:88425, conInst:103225, foto:'cassette' },
  { btu: 12000, nombre:'LG Split Inverter 12K VX121C1 110V', volt:110, tipo:'Inverter', seer:'', solo:18225, conInst:22025, foto:'split_lg' },
  { btu: 12000, nombre:'HISENSE Básico 12K AC122CE 220V - SEER 14', volt:220, tipo:'Convencional', seer:'SEER 14', solo:10395, conInst:14195, foto:'split_gplus' },
  { btu: 12000, nombre:'HISENSE Inverter 12K ATR121KA 110V - SEER 18', volt:110, tipo:'Inverter', seer:'SEER 18', solo:14715, conInst:18515, foto:'split_gplus' },
  { btu: 12000, nombre:'HISENSE Inverter 12K ATR122CJ 220V - SEER 18', volt:220, tipo:'Inverter', seer:'SEER 18', solo:13230, conInst:17030, foto:'split_gplus' },
  { btu: 18000, nombre:'HISENSE Inverter 18K ATR182CJ - SEER 18', volt:220, tipo:'Inverter', seer:'SEER 18', solo:21060, conInst:24860, foto:'split_gplus' },
  { btu: 24000, nombre:'HISENSE Inverter 24K ATR242CJ - SEER 18', volt:220, tipo:'Inverter', seer:'SEER 18', solo:25650, conInst:31250, foto:'split_gplus' },
];

function formatC(n){ return 'C$' + n.toLocaleString('en-US'); }
function recomendarBTU(m2){
  if(m2 <= 18) return 12000;
  if(m2 <= 25) return 18000;
  if(m2 <= 35) return 24000;
  if(m2 <= 50) return 36000;
  return 60000;
}

// CORREGIDO: Si no existe BTU + Voltaje exacto, NO inventa, devuelve null
function buscarExacto(btu, volt){
  return PRECIOS.filter(p => p.btu === btu && p.volt === volt);
}

function textoCotizar(lista, conInst){
  let txt = ``;
  lista.forEach(p => {
    const precio = conInst ? p.conInst : p.solo;
    const seerTxt = p.seer ? ` - ${p.seer}` : '';
    const tipoTxt = p.tipo === 'Inverter' ? '✅ Inverter' : p.tipo;
    txt += `• ${p.nombre}\n  ${tipoTxt}${seerTxt}\n  ${formatC(precio)}${conInst && p.conInst!==p.solo ? ' (con instalación)' : ' (solo equipo)'}\n`;
    if(p.nombre.includes('Inverter') && conInst) txt += `  🎁 Incluye protector de voltaje de cortesía\n`;
    if(p.tipo==='Portátil' || p.tipo==='Ventana') txt += `  No requiere instalación\n`;
    txt += `\n`;
  });
  if(conInst){
    txt += `*Precio con instalación incluye:*\n• Servicio de instalación básica\n• Material de fijación\n• Sellado\n• Base de la unidad condensadora\n• Protector de voltaje de cortesía\n\n`;
  }
  txt += `*Garantía:* 18 meses en compresor y 1 año en partes del equipo\n`;
  txt += `*Envío:* Hasta la puerta de su casa en Managua 🏠\n`;
  txt += `\nEscriba *0* para volver al menú principal`;
  return txt;
}

async function enviar(to, texto){
  await axios.post(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, { messaging_product:'whatsapp', to, type:'text', text:{ body:texto } }, { headers:{ Authorization:`Bearer ${TOKEN}` } });
}
async function enviarFoto(to, fotoKey, caption){
  const link = FOTOS[fotoKey];
  if(!link || link.includes('PEGA_AQUI')) return;
  try{
    await axios.post(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, { messaging_product:'whatsapp', to, type:'image', image:{ link, caption: caption || 'ANCA Marketplace 💙' } }, { headers:{ Authorization:`Bearer ${TOKEN}` } });
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
  return `Bienvenido a ANCA Marketplace 💙\n${nombre ? `Hola ${nombre}, ` : ''}¿En qué le puedo ayudar el día de hoy?\n\n*1* - Suministro e Instalación de Aire Acondicionado\n*2* - Suministro de Aire Acondicionado (solo equipo)\n*3* - Servicios de Mantenimiento\n*4* - Garantía por Desperfecto de Fábrica\n*5* - Hablar con Asesor de Ventas\n*0* - Volver al menú principal\n\nEscríbame el número de la opción, por ejemplo *1*`;
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

    // ===== VOLVER AL MENU EN CUALQUIER MOMENTO - NUEVO =====
    if(texto==='0' || texto==='menu' || texto==='menú' || texto==='volver' || texto==='inicio' || texto==='regresar'){
      if(!s.nombre){
        s.paso='nombre';
        await enviar(from, `Bienvenido a ANCA Marketplace 💙\n¿Me indica su nombre para atenderle?`);
        return;
      }
      s.paso='menu';
      await enviar(from, menuPrincipal(s.nombre));
      return;
    }
    // Solo la primera vez pregunta nombre. Si ya tiene nombre y dice Hola, va al menú, no vuelve a preguntar nombre.
    if(texto==='hola' && s.nombre){
      s.paso='menu';
      await enviar(from, menuPrincipal(s.nombre));
      return;
    }
    if(texto==='hola' && !s.nombre){
      s.paso='nombre';
      await enviar(from, `Bienvenido a ANCA Marketplace 💙\n¿Me indica su nombre para atenderle?`);
      return;
    }

    if(s.paso==='nombre'){
      s.nombre = textoOriginal.split(' ')[0]; s.paso='menu';
      await enviar(from, menuPrincipal(s.nombre)); return;
    }

    const quiereSolo = texto.includes('sin instal') || texto.includes('solo equipo') || texto.includes('solo el aire') || texto.includes('solo aire') || texto.includes('sin instalar') || texto==='2';
    const quiereCon = texto.includes('con instal') || texto.includes('instalado') || texto==='1';

    // Detección por marca - solo si está en menú
    if(s.paso==='menu'){
      if(texto.includes('lg')){
        await enviarFoto(from, 'split_lg', 'LG Split Inverter 12K - ANCA Marketplace');
        await enviar(from, `Este es el *LG Split Inverter 12K VX121C1 110V* 💙\n\nSolo equipo: *C$18,225*\nCon instalación: *C$22,025*\n\n*Garantía:* 18 meses compresor, 1 año partes.\n*Envío:* Hasta su casa en Managua 🏠\n\n¿Le apartamos este equipo? Escriba *Sí, lo quiero*\n\nEscriba *0* para volver al menú principal`);
        s.paso='confirmar'; s.btu=12000; s.volt=110; s.opcion='con_inst'; return;
      }
      if(texto.includes('piso techo') || texto.includes('piso-techo') || texto.includes('60k') || texto.includes('60000')){
        await enviarFoto(from, 'piso_techo_60k', 'GPLUS Piso-Techo 60K - ANCA Marketplace');
        await enviar(from, `Este es el *Piso-Techo 60,000 BTU* 💙\n\nGPLUS Piso-Techo 60K: Solo *C$67,500* / Con instalación *C$82,300*\nGPLUS Piso-Techo Inverter 60K: Solo *C$72,900* / Con instalación *C$87,700*\n\nIncluye instalación básica, fijación, sellado, base y protector.\n\nEscriba *0* para volver al menú principal`);
        s.paso='confirmar'; s.btu=60000; s.volt=220; return;
      }
    }

    if(s.paso==='menu'){
      if(texto==='1' || quiereCon){ s.opcion='con_inst'; s.paso='medidas'; await enviar(from, `Perfecto ${s.nombre}, le ayudamos con *Suministro e Instalación* 💙\n\n¿Me indica las medidas de su cuarto? Por ejemplo *3x3* o *5x5*\n\nEscriba *0* para volver al menú principal`); return; }
      if(texto==='2' || quiereSolo){ s.opcion='solo_equipo'; s.paso='medidas'; await enviar(from, `Perfecto ${s.nombre}, le ayudamos con *Suministro (solo equipo)* 💙\n\n¿Me indica las medidas de su cuarto? Por ejemplo *3x3*\n\nEscriba *0* para volver al menú principal`); return; }
      if(texto==='3'){ s.paso='mant'; await enviar(from, `Claro ${s.nombre}, para *Mantenimiento* 🛠️\n\n¿Qué le pasa a su aire? Por ejemplo: *bota agua, hace ruido, no enfría*\n\nEscriba *0* para volver al menú principal`); return; }
      if(texto==='4'){ s.paso='garantia'; await enviar(from, `Entendido ${s.nombre}, para *Garantía por Desperfecto de Fábrica* 📋\n\n¿Me indica qué falla tiene y cuándo lo compró?\n\nEscriba *0* para volver al menú principal`); return; }
      if(texto==='5' || texto.includes('asesor')){ s.paso='asesor'; await enviar(from, `Con gusto ${s.nombre} 💙\n\nLe conecto con un *Asesor de Ventas* de ANCA.\n\n¿Me indica su teléfono y zona para que le llamen?\n\nEscriba *0* para volver al menú principal`); return; }
      if(texto.length>3){
        const ia = await preguntarGemini(`Eres asesor de ANCA en Nicaragua, profesional. Cliente ${s.nombre} dice: "${textoOriginal}". Si dice que su aire bota agua, hace ruido o no enfría, es MANTENIMIENTO opción 3, no cotización. Si pregunta por aire, responde útil en max 4 líneas. Nunca digas "asesor humano", di "Asesor de Ventas". Nunca preguntes "¿Qué haces?". Al final di: Escriba 0 para volver al menú.`);
        if(ia){ await enviar(from, ia + `\n\nEscriba *0* para volver al menú principal`); return; }
      }
      await enviar(from, menuPrincipal(s.nombre)); return;
    }

    if(s.paso==='medidas'){
      const m = texto.match(/(\d+)[xX*](\d+)/);
      if(m){
        s.m2 = parseInt(m[1])*parseInt(m[2]); s.btu = recomendarBTU(s.m2); s.paso='voltaje';
        await enviar(from, `Perfecto, su cuarto es de *${s.m2} m²*.\n\nLe recomendamos *${s.btu.toLocaleString()} BTU*.\n\n¿Su casa tiene voltaje *110V* o *220V*?\nEscriba *110* o *220*\n\nEscriba *0* para volver al menú principal`);
        return;
      }
      if(quiereSolo){ s.opcion='solo_equipo'; await enviar(from, `Entendido, lo cambiamos a *Solo equipo* sin instalación 💙\n\n¿Me indica las medidas? Por ejemplo *3x3*\n\nEscriba *0* para volver al menú principal`); return; }
      await enviar(from, `¿Me indica las medidas? Por ejemplo *3x3* o *5x5*\n\nEscriba *0* para volver al menú principal`); return;
    }

    if(s.paso==='voltaje'){
      if(texto.includes('110')) s.volt=110;
      else if(texto.includes('220')) s.volt=220;
      else { await enviar(from, `¿Es *110V* o *220V*? Escriba 110 o 220\n\nEscriba *0* para volver al menú principal`); return; }

      // ===== CORRECCIÓN CLAVE: NO INVENTAR 18K 110V =====
      const lista = buscarExacto(s.btu, s.volt);
      if(lista.length===0){
        // Caso de tu captura: 5x5 = 25m2 = 18K, pero pidió 110V y 18K 110V NO existe
        if(s.btu===18000 && s.volt===110){
          await enviar(from, `Le explico ${s.nombre} 💙\n\nPara *18,000 BTU* NO tenemos en *110V*, solo en *220V*.\n\nEn 110V solo tenemos hasta *12,000 BTU*.\n\n¿Tiene *220V* en su casa? Si tiene 220V le muestro los 18K.\nSi solo tiene 110V, le puedo ofrecer 12K.\n\nEscriba *220* si tiene 220V o *12K* si quiere ver los de 110V.\n\nEscriba *0* para volver al menú principal`);
          s.paso='voltaje_correccion'; return;
        }
        await enviar(from, `Para *${s.btu.toLocaleString()} BTU* en *${s.volt}V* no tenemos disponible en este momento.\n\n¿Tiene el otro voltaje? Escriba *110* o *220*\n\nEscriba *0* para volver al menú principal`);
        s.paso='voltaje'; return;
      }

      const conInst = s.opcion==='con_inst';
      if(lista.length>0) await enviarFoto(from, lista[0].foto, lista[0].nombre);
      s.paso = conInst ? 'zona_inst' : 'zona_entrega';
      await enviar(from, `Para *${s.btu.toLocaleString()} BTU - ${s.volt}V* tenemos:\n\n${textoCotizar(lista, conInst)}\n\n${conInst ? '¿En qué zona sería la instalación?' : '¿En qué zona sería la entrega del equipo?'}`);
      return;
    }

    // Si estaba en corrección de 18K 110V y ahora dice 220
    if(s.paso==='voltaje_correccion'){
      if(texto.includes('220')){ s.volt=220; const lista = buscarExacto(s.btu, 220); if(lista.length>0) await enviarFoto(from, lista[0].foto, lista[0].nombre); s.paso = s.opcion==='con_inst' ? 'zona_inst' : 'zona_entrega'; await enviar(from, `Perfecto, en *220V* sí tenemos 18K:\n\n${textoCotizar(lista, s.opcion==='con_inst')}\n\n¿En qué zona sería ${s.opcion==='con_inst' ? 'la instalación' : 'la entrega'}?`); return; }
      if(texto.includes('12')){ s.btu=12000; s.volt=110; const lista = buscarExacto(12000,110); if(lista.length>0) await enviarFoto(from, lista[0].foto, lista[0].nombre); s.paso = s.opcion==='con_inst' ? 'zona_inst' : 'zona_entrega'; await enviar(from, `En *12K - 110V* tenemos:\n\n${textoCotizar(lista, s.opcion==='con_inst')}\n\n¿En qué zona sería ${s.opcion==='con_inst' ? 'la instalación' : 'la entrega'}?`); return; }
      await enviar(from, `Escriba *220* si tiene 220V o *12K* si quiere ver los de 110V.\n\nEscriba *0* para volver al menú principal`); return;
    }

    if(s.paso==='zona_inst' || s.paso==='zona_entrega'){
      if(quiereSolo){
        s.opcion='solo_equipo'; s.paso='zona_entrega';
        const lista = buscarExacto(s.btu, s.volt);
        if(lista.length>0) await enviarFoto(from, lista[0].foto, lista[0].nombre);
        await enviar(from, `Entendido, lo dejamos en *Solo equipo* sin instalación 💙\n\n${textoCotizar(lista, false)}\n\n¿En qué zona sería la entrega?`);
        return;
      }
      s.zona = textoOriginal; s.paso='confirmar';
      const lista = buscarExacto(s.btu, s.volt);
      await enviar(from, `Gracias ${s.nombre} 💙\n\nResumen:\n• Opción: ${s.opcion==='con_inst' ? 'Suministro e Instalación' : 'Solo equipo'}\n• Cuarto: ${s.m2} m² - ${s.btu.toLocaleString()} BTU - ${s.volt}V\n• Zona: ${s.zona}\n\n${textoCotizar(lista, s.opcion==='con_inst')}\n\n¿Le apartamos el equipo? Escriba *Sí, lo quiero* y un Asesor de Ventas le confirma.`);
      return;
    }

    if(s.paso==='mant'){
      const ia = await preguntarGemini(`Eres técnico de ANCA. Cliente dice: "${textoOriginal}". Si dice bota agua, ruido, no enfría, da 2 causas comunes y 1 consejo. No cotices aires nuevos. Dile que un Asesor de Ventas coordina visita. Max 5 líneas.`);
      await enviar(from, (ia || `Gracias. Un Asesor de Ventas le coordina la visita. ¿Me indica zona y teléfono?`) + `\n\nEscriba *0* para volver al menú principal`);
      s.paso='final'; return;
    }
    if(s.paso==='garantia'){
      await enviar(from, `Gracias ${s.nombre}, registramos su caso de *Garantía por Desperfecto de Fábrica* 📋\n\n¿Me indica teléfono y zona para que un Asesor de Ventas le llame?\n\nEscriba *0* para volver al menú principal`);
      s.paso='final'; return;
    }
    if(s.paso==='confirmar' || s.paso==='final' || s.paso==='asesor'){
      if(texto.includes('si') || texto.includes('lo quiero') || texto.includes('apart')){
        await enviar(from, `¡Perfecto ${s.nombre}! 💙\n\nYa dejamos su solicitud registrada. Un *Asesor de Ventas* de ANCA le va a contactar para confirmar precio final y entrega.\n\n¿Algo más? Escriba *0* para volver al menú principal.`);
        s.paso='menu_final'; return;
      }
      const ia = await preguntarGemini(`Eres asesor ANCA. Cliente ${s.nombre} pregunta: "${textoOriginal}". Solo usa precios de Excel: 12K desde C$10,395 solo / C$14,195 con instalación. 18K solo existe en 220V desde C$18,900 / C$22,700. Nunca digas que 18K 110V existe. Max 4 líneas.`);
      if(ia){ await enviar(from, ia + `\n\nEscriba *0* para volver al menú principal`); return; }
      await enviar(from, `Entendido. Un Asesor de Ventas le va a contactar.\n\nEscriba *0* para volver al menú principal`); return;
    }
    if(s.paso==='menu_final'){ await enviar(from, menuPrincipal(s.nombre)); s.paso='menu'; return; }
  }catch(e){ console.log(e); }
});

app.get('/', (req,res)=> res.send('ANCA v13 OK'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('ANCA v13', PORT));
