// BOT ANCA - v20 FINAL - IA PARA ENTENDER, TABLA PARA NO INVENTAR
const fetch = require('node-fetch');
const express = require('express');
const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'anca2025';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ANCA_LAT = 12.1340;
const ANCA_LON = -86.3590;
const KM_GRATIS = 20;
const PRECIO_KM_EXTRA = 16;

// CATALOGO REAL - UNICA FUENTE DE VERDAD. LA IA NO PUEDE INVENTAR FUERA DE AQUI.
const PRODUCTOS = [
  {id:"p1", marca:"GPLUS", tipo:"PORTATIL", btu:12000, modelo:"GP-P12AO", voltaje:"110V", inverter:"No", seer:"-", suministro:12825, instalado:12825},
  {id:"p2", marca:"GPLUS", tipo:"VENTANA", btu:6000, modelo:"GP-W061MS", voltaje:"110V", inverter:"No", seer:"-", suministro:6210, instalado:6210},
  {id:"p3", marca:"GPLUS", tipo:"VENTANA", btu:12000, modelo:"GP-W121MC", voltaje:"110V", inverter:"No", seer:"-", suministro:12825, instalado:12825},
  {id:"p4", marca:"GPLUS", tipo:"SPLIT", btu:12000, modelo:"GP-S121C", voltaje:"110V", inverter:"No", seer:"SEER 13", suministro:11475, instalado:15275},
  {id:"p5", marca:"GPLUS", tipo:"SPLIT", btu:12000, modelo:"GP-S122C", voltaje:"220V", inverter:"No", seer:"SEER 13", suministro:10395, instalado:14195},
  {id:"p6", marca:"GPLUS", tipo:"SPLIT", btu:18000, modelo:"GP-S182C", voltaje:"220V", inverter:"No", seer:"SEER 14", suministro:18900, instalado:22700},
  {id:"p7", marca:"GPLUS", tipo:"SPLIT", btu:24000, modelo:"GP-S242C", voltaje:"220V", inverter:"No", seer:"SEER 14", suministro:22950, instalado:28550},
  {id:"p8", marca:"GPLUS", tipo:"SPLIT", btu:36000, modelo:"GP-S362C", voltaje:"220V", inverter:"No", seer:"SEER 14", suministro:35100, instalado:42600},
  {id:"p9", marca:"GPLUS", tipo:"PISO-TECHO", btu:60000, modelo:"GP-60PT", voltaje:"220V", inverter:"No", seer:"SEER 13", suministro:67500, instalado:82300},
  {id:"p10", marca:"GPLUS", tipo:"SPLIT", btu:12000, modelo:"GP-S12000INV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:13230, instalado:17030},
  {id:"p11", marca:"GPLUS", tipo:"SPLIT", btu:18000, modelo:"GP-S18000INV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:21060, instalado:24860},
  {id:"p12", marca:"GPLUS", tipo:"SPLIT", btu:24000, modelo:"GP-S24000INV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:25650, instalado:31250},
  {id:"p13", marca:"GPLUS", tipo:"SPLIT", btu:36000, modelo:"GP-S36000INV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:41850, instalado:49350},
  {id:"p14", marca:"GPLUS", tipo:"PISO-TECHO", btu:60000, modelo:"GP-60PTINV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:72900, instalado:87700},
  {id:"p15", marca:"GPLUS", tipo:"CASSETTE", btu:60000, modelo:"GP-60CTINV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 17", suministro:88425, instalado:103225},
  {id:"p16", marca:"LG", tipo:"SPLIT", btu:12000, modelo:"VX121C1", voltaje:"110V", inverter:"Si - DUAL INVERTER", seer:"SEER 18", suministro:18225, instalado:22025},
  {id:"p17", marca:"HISENSE", tipo:"SPLIT", btu:12000, modelo:"AC122CE", voltaje:"220V", inverter:"No - ESTANDAR", seer:"SEER 14", suministro:10395, instalado:14195},
  {id:"p18", marca:"HISENSE", tipo:"SPLIT", btu:12000, modelo:"ATR121KA", voltaje:"110V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:14715, instalado:18515},
  {id:"p19", marca:"HISENSE", tipo:"SPLIT", btu:12000, modelo:"ATR122CJ", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:13230, instalado:17030},
  {id:"p20", marca:"HISENSE", tipo:"SPLIT", btu:18000, modelo:"ATR182CJ", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:21060, instalado:24860},
  {id:"p21", marca:"HISENSE", tipo:"SPLIT", btu:24000, modelo:"ATR242CJ", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:25650, instalado:31250},
];

function fmt(n){ return 'C$' + n.toLocaleString('en-US'); }
function recomendarBtu(m2){
  if(m2<=12) return 12000; if(m2<=18) return 12000; if(m2<=24) return 18000; if(m2<=36) return 24000; if(m2<=50) return 36000; return 60000;
}
function haversine(lat1, lon1, lat2, lon2){
  const R=6371; const dlat=(lat2-lat1)*Math.PI/180; const dlon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dlat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dlon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
function calcularKm(lat, lon){
  const dist = Math.round(haversine(ANCA_LAT, ANCA_LON, lat, lon)*1.3*10)/10;
  if(dist<=KM_GRATIS) return {dist, costo:0};
  return {dist, costo: Math.round((dist-KM_GRATIS)*PRECIO_KM_EXTRA)};
}

// --- IA: SOLO INTERPRETA, NUNCA INVENTA PRECIOS ---
async function cerebroIA(mensajeCliente, datosActuales){
  if(!GEMINI_API_KEY) return null;
  const catalogoTexto = PRODUCTOS.map(p=>`${p.marca} ${p.tipo} ${p.btu}BTU ${p.voltaje} ${p.modelo} Suministro:${p.suministro} Instalado:${p.instalado}`).join('\n');
  const prompt = `
Eres el asesor virtual de ANCA Marketplace, empresa seria de Nicaragua. Hablas de usted, formal, profesional, sin emojis exagerados, sin inventar.

REGLAS DURAS, NO LAS ROMPAS NUNCA:
1. Solo puedes ofrecer equipos de este catalogo, nada fuera de el:
${catalogoTexto}
2. REGLA DE VOLTAJE: 6000 y 12000 BTU existen en 110V y 220V. 18000 BTU en adelante SOLO existen en 220V. Si el cliente pide 18000, 24000, 36000 o 60000 en 110V, NO le inventes uno. Dile que no existe en 110V y ofrece 220V o 2 equipos de 12000 en 110V.
3. Los precios son exactamente los del catalogo. Nunca inventes otro precio.
4. Kilometraje: 20 km gratis desde Km 9 Carretera Nueva a Leon, Altos de Motastepe. Despues C$16 por km extra. Solo se calcula cuando el cliente manda su ubicacion, nunca antes.
5. Si el cliente pide algo que no tienes, di claramente "No tenemos ese modelo" y ofrece lo mas cercano que SI tienes.

DATOS QUE YA TENEMOS DEL CLIENTE: ${JSON.stringify(datosActuales)}
MENSAJE DEL CLIENTE: "${mensajeCliente}"

Devuelve SOLO este JSON, sin texto extra:
{
  "nombre": "nombre completo o null si no lo dijo",
  "ubicacionTexto": "barrio y municipio o null",
  "m2": "numero de metros cuadrados o null",
  "btuSolicitado": "numero o null si pidio BTU directo",
  "voltaje": "110V o 220V o null",
  "marcaSolicitada": "GPLUS, LG, HISENSE o null",
  "tipoSolicitado": "SPLIT, VENTANA, PORTATIL, PISO-TECHO, CASSETTE o null",
  "quiere": "instalado, solo_equipo, asesor, o null",
  "respuestaSugerida": "respuesta corta y profesional para el cliente, sin precios inventados"
}
`;
  try{
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({contents:[{parts:[{text: prompt}]}]})
    });
    const j = await r.json();
    const txt = j.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const m = txt.match(/\{[\s\S]*\}/);
    if(!m) return null;
    return JSON.parse(m[0]);
  }catch(e){ console.log('IA ERROR', e); return null; }
}

async function enviar(to, payload){
  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
  const r = await fetch(url, {method:'POST', headers:{Authorization:`Bearer ${WHATSAPP_TOKEN}`, 'Content-Type':'application/json'}, body: JSON.stringify({messaging_product:'whatsapp', to, ...payload})});
  const data = await r.text(); console.log('ENVIO', r.status, data); return data;
}
function enviarTexto(to, body){ return enviar(to, {type:'text', text:{body}}); }

const estado = {};
app.get('/webhook', (req,res)=>{
  const mode=req.query['hub.mode']; const token=req.query['hub.verify_token']; const challenge=req.query['hub.challenge'];
  if(mode==='subscribe' && token===VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

app.post('/webhook', async (req,res)=>{
  try{
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if(!msg) return res.sendStatus(200);
    const from = msg.from;
    let st = estado[from] || {paso:'inicio', nombre:null, ubicacionTexto:null, m2:null, btuRecomendado:null, voltaje:null, modo:null, productoId:null};
    let textoRaw = msg.text?.body?.trim() || '';
    let texto = textoRaw.toLowerCase();
    let btnId = msg.interactive?.button_reply?.id || '';

    if(texto==='reiniciar'){
      estado[from]={paso:'nombre', nombre:null, ubicacionTexto:null, m2:null, btuRecomendado:null, voltaje:null, modo:null, productoId:null};
      await enviarTexto(from, 'Buenas tardes, le atiende ANCA Marketplace.\n\n¿Con quién tengo el gusto? Me indica su nombre y apellido, por favor.');
      return res.sendStatus(200);
    }

    // UBICACION - SOLO AL FINAL, PARA CALCULAR TOTAL REAL
    if(msg.type==='location'){
      const {dist, costo} = calcularKm(msg.location.latitude, msg.location.longitude);
      const p = PRODUCTOS.find(x=>x.id===st.productoId);
      if(p && st.modo==='instalado'){
        const total = p.instalado + costo;
        console.log(`LEAD ANCA - Nombre:${st.nombre} | Tel:${from} | Vive:${st.ubicacionTexto} | M2:${st.m2} | Voltaje:${st.voltaje} | Equipo:${p.marca} ${p.modelo} | Dist:${dist}km | Total:${fmt(total)}`);
        await enviarTexto(from, `Gracias, ${st.nombre}.\n\nCOTIZACIÓN FINAL - ANCA MARKETPLACE\n\nEquipo: ${p.marca} ${p.tipo} ${p.btu} BTU\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\nPrecio con instalación: ${fmt(p.instalado)}\nDistancia desde nuestra tienda: ${dist} km\n${costo>0 ? `Costo por kilometraje adicional: ${fmt(costo)}\n` : 'Kilometraje dentro de cobertura sin costo.\n'}TOTAL A PAGAR: ${fmt(total)}\n\nIncluye instalación básica, base, sellado y protector de voltaje de cortesía.\nGarantía: 18 meses en compresor, 1 año en partes.\n\n¿Desea que le apartemos este equipo? Responda SI para apartarlo.`);
        estado[from]={...st, paso:'esperando_si'};
      }
      return res.sendStatus(200);
    }

    if(st.paso==='inicio'){
      estado[from]={...st, paso:'nombre'};
      await enviarTexto(from, 'Buenas tardes, le atiende ANCA Marketplace.\n\n¿Con quién tengo el gusto? Me indica su nombre y apellido, por favor.');
      return res.sendStatus(200);
    }

    // USAR IA PARA ENTENDER, PERO VALIDAR CONTRA LA TABLA
    const ia = await cerebroIA(textoRaw, st);

    // PASO NOMBRE
    if(st.paso==='nombre'){
      const nombre = ia?.nombre || textoRaw;
      if(nombre.length < 3 || texto==='hola'){ await enviarTexto(from, 'Me indica su nombre y apellido, por favor, para atenderle mejor.'); return res.sendStatus(200); }
      st.nombre = nombre; st.paso='donde_vive'; estado[from]=st;
      await enviarTexto(from, `Mucho gusto, ${st.nombre}.\n\n¿En qué barrio y municipio será la instalación?`);
      return res.sendStatus(200);
    }
    if(st.paso==='donde_vive'){
      st.ubicacionTexto = ia?.ubicacionTexto || textoRaw; st.paso='medidas'; estado[from]=st;
      await enviarTexto(from, `Anotado, ${st.nombre}: ${st.ubicacionTexto}.\n\nPara recomendarle la capacidad correcta, ¿qué medidas aproximadas tiene el ambiente a climatizar? Puede escribirlo como guste.`);
      return res.sendStatus(200);
    }
    if(st.paso==='medidas'){
      let m2 = ia?.m2 || null;
      if(!m2){
        const nums = textoRaw.replace(',','.').match(/(\d+(\.\d+)?)/g);
        if(nums && nums.length>=2) m2 = parseFloat(nums[0])*parseFloat(nums[1]);
        else if(nums && nums.length===1) m2 = parseFloat(nums[0]);
      }
      // Si el cliente pidio BTU directo, respetarlo, no imponer
      if(ia?.btuSolicitado){ st.btuRecomendado = ia.btuSolicitado; st.m2 = m2 || 0; }
      else if(m2){ st.m2 = m2; st.btuRecomendado = recomendarBtu(m2); }
      else { await enviarTexto(from, 'Disculpe, no logré identificar las medidas. ¿Me indica el largo por el ancho? Por ejemplo: 4 x 3, o la capacidad que busca, por ejemplo 12000 BTU.'); return res.sendStatus(200); }

      st.paso='voltaje'; estado[from]=st;
      // Si ya dijo voltaje en el mismo mensaje, usarlo
      if(ia?.voltaje) st.voltaje = ia.voltaje;
      await enviarTexto(from, `${st.nombre}, para ${st.m2 ? st.m2+' m2' : 'su ambiente'} la capacidad es de ${st.btuRecomendado} BTU.\n\n${st.btuRecomendado>=18000 ? 'Le comento que a partir de 18,000 BTU, los equipos trabajan únicamente en 220V.\n\n' : ''}¿Con qué voltaje cuenta en su vivienda? ¿110V o 220V?`);
      return res.sendStatus(200);
    }
    if(st.paso==='voltaje'){
      const volt = ia?.voltaje || (texto.includes('220') ? '220V' : texto.includes('110') ? '110V' : null);
      if(!volt){ await enviarTexto(from, '¿Me confirma el voltaje? ¿110V o 220V?'); return res.sendStatus(200); }
      // VALIDACION DE TU TABLA - NUNCA INVENTAR
      if(st.btuRecomendado >= 18000 && volt === '110V'){
        await enviarTexto(from, `${st.nombre}, le explico con transparencia: para ${st.btuRecomendado} BTU no existe equipo en 110V. Todos los equipos de 18,000 BTU en adelante son 220V.\n\n¿Desea que le cotice en 220V o prefiere 2 equipos de 12,000 BTU en 110V? Responda 220V o 2 EQUIPOS.`);
        st.paso='resolver_110'; estado[from]=st; return res.sendStatus(200);
      }
      st.voltaje = volt; st.paso='modo'; estado[from]=st;
      await enviarTexto(from, `Perfecto, ${st.nombre}. Voltaje: ${volt}.\n\n¿Cómo desea su cotización?\nResponda: INSTALADO, SOLO EQUIPO o ASESOR.`);
      return res.sendStatus(200);
    }
    if(st.paso==='resolver_110'){
      if(texto.includes('220')){ st.voltaje='220V'; st.paso='modo'; estado[from]=st; await enviarTexto(from, 'Perfecto, le cotizo en 220V. ¿Cómo desea su cotización? Responda: INSTALADO, SOLO EQUIPO o ASESOR.'); return res.sendStatus(200); }
      if(texto.includes('2') || texto.includes('dos')){ st.btuRecomendado=12000; st.voltaje='110V'; st.paso='modo'; estado[from]=st; await enviarTexto(from, 'Entendido. Le cotizo 2 equipos de 12,000 BTU en 110V. ¿Cómo desea su cotización? Responda: INSTALADO o SOLO EQUIPO.'); return res.sendStatus(200); }
      await enviarTexto(from, 'Responda 220V o 2 EQUIPOS.'); return res.sendStatus(200);
    }
    if(st.paso==='modo'){
      const quiere = ia?.quiere || (texto.includes('asesor') ? 'asesor' : texto.includes('solo') ? 'solo_equipo' : texto.includes('instal') ? 'instalado' : null);
      if(quiere==='asesor'){
        console.log(`LEAD ASESOR - ${st.nombre} | ${from} | ${st.ubicacionTexto} | ${st.m2}m2 | ${st.btuRecomendado}BTU | ${st.voltaje}`);
        await enviarTexto(from, `Con gusto, ${st.nombre}. Un asesor de ANCA le atenderá en breve.\n\nDatos registrados:\nNombre: ${st.nombre}\nUbicación: ${st.ubicacionTexto}\nMedidas: ${st.m2} m2\nCapacidad: ${st.btuRecomendado} BTU\nVoltaje: ${st.voltaje}`);
        return res.sendStatus(200);
      }
      if(!quiere){ await enviarTexto(from, '¿Cómo desea su cotización? Responda: INSTALADO o SOLO EQUIPO.'); return res.sendStatus(200); }
      st.modo = quiere==='solo_equipo' ? 'suministro' : 'instalado'; st.paso='elegir_equipo'; estado[from]=st;
      // MOSTRAR SOLO LO QUE EXISTE EN LA TABLA, FILTRADO POR LO QUE PIDIO
      let filtrados = PRODUCTOS.filter(p=>p.btu===st.btuRecomendado && p.voltaje===st.voltaje);
      if(ia?.marcaSolicitada) filtrados = filtrados.filter(p=>p.marca===ia.marcaSolicitada);
      if(ia?.tipoSolicitado) filtrados = filtrados.filter(p=>p.tipo===ia.tipoSolicitado);
      if(filtrados.length===0){
        // No inventar, decir la verdad y ofrecer lo que SI hay
        const disponibles = PRODUCTOS.filter(p=>p.btu===st.btuRecomendado);
        if(disponibles.length===0){ await enviarTexto(from, `${st.nombre}, disculpe, no tenemos disponibilidad en ${st.btuRecomendado} BTU. ¿Le ofrezco la capacidad más cercana?`); return res.sendStatus(200); }
        await enviarTexto(from, `${st.nombre}, en ${st.btuRecomendado} BTU y ${st.voltaje} no tenemos esa marca/tipo, pero sí tenemos estas opciones reales en ${st.btuRecomendado} BTU:`);
        filtrados = disponibles;
      }
      st.listaActual = filtrados.map(p=>p.id); estado[from]=st;
      let textoLista = `${st.nombre}, estas son las opciones disponibles en ${st.btuRecomendado} BTU en ${st.voltaje} ${st.modo==='instalado' ? 'con instalación' : 'solo equipo'}:\n\n`;
      filtrados.forEach((p,i)=>{
        const precio = st.modo==='instalado' ? p.instalado : p.suministro;
        textoLista += `${i+1}. ${p.marca} ${p.tipo} ${p.btu} BTU - Modelo ${p.modelo}\n   Voltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n   Precio: ${fmt(precio)}\n\n`;
      });
      textoLista += 'Responda con el número del equipo que le interesa. Ej: 1';
      await enviarTexto(from, textoLista);
      return res.sendStatus(200);
    }
    if(st.paso==='elegir_equipo'){
      const num = parseInt(texto);
      const lista = st.listaActual || [];
      if(num>=1 && num<=lista.length){
        const p = PRODUCTOS.find(x=>x.id===lista[num-1]);
        st.productoId = p.id; estado[from]=st;
        if(st.modo==='instalado'){
          st.paso='ubicacion_final'; estado[from]=st;
          await enviarTexto(from, `Excelente elección, ${st.nombre}.\n\n${p.marca} ${p.tipo} ${p.btu} BTU\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\nPrecio con instalación base: ${fmt(p.instalado)}\n\nPara brindarle el total exacto, ¿me comparte su ubicación por WhatsApp?\nAdjuntar > Ubicación > Enviar ubicación actual.`);
        } else {
          await enviarTexto(from, `Excelente elección, ${st.nombre}.\n\n${p.marca} ${p.tipo} ${p.btu} BTU\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\nTOTAL SOLO EQUIPO: ${fmt(p.suministro)}\n\nIncluye equipo nuevo en caja, garantía 18 meses en compresor y 1 año en partes, envío en Managua.\n\n¿Desea que le apartemos este equipo? Responda SI.`);
          st.paso='esperando_si'; estado[from]=st;
        }
        return res.sendStatus(200);
      }
      await enviarTexto(from, `Por favor, responda con el número del equipo, del 1 al ${lista.length}. Si desea otra marca o capacidad, dígamelo y le muestro lo que sí tenemos.`);
      return res.sendStatus(200);
    }
    if(st.paso==='esperando_si' && (texto==='si' || texto==='sí')){
      const p = PRODUCTOS.find(x=>x.id===st.productoId);
      console.log(`APARTADO - ${st.nombre} | ${from} | ${p?.marca} ${p?.modelo} | ${st.ubicacionTexto}`);
      await enviarTexto(from, `Listo, ${st.nombre}. Su equipo quedó apartado.\n\nUn asesor de ANCA le contactará para confirmar su pedido.\n\nResumen:\nNombre: ${st.nombre}\nUbicación: ${st.ubicacionTexto}\nEquipo: ${p?.marca} ${p?.modelo}\n\nGracias por elegir ANCA Marketplace.`);
      estado[from]={paso:'inicio', nombre:null, ubicacionTexto:null, m2:null, btuRecomendado:null, voltaje:null, modo:null, productoId:null};
      return res.sendStatus(200);
    }
    if(!st.nombre){ estado[from]={...st, paso:'nombre'}; await enviarTexto(from, 'Buenas tardes, le atiende ANCA Marketplace. ¿Con quién tengo el gusto?'); }
    else await enviarTexto(from, `${st.nombre}, disculpe, no logré entenderle. ¿Me puede repetir su respuesta?`);
    return res.sendStatus(200);
  } catch(e){ console.log('ERROR', e); return res.sendStatus(200); }
});

app.get('/', (req,res)=>res.send('Bot ANCA activo'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('ANCA corriendo en puerto '+PORT));
