// BOT ANCA - v18 FINAL - NO SE SALTA PASOS
const fetch = require('node-fetch');
const express = require('express');
const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'anca2025';

const ANCA_LAT = 12.1340;
const ANCA_LON = -86.3590;
const KM_GRATIS = 20;
const PRECIO_KM_EXTRA = 16;

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
async function enviar(to, payload){
  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
  const r = await fetch(url, {method:'POST', headers:{Authorization:`Bearer ${WHATSAPP_TOKEN}`, 'Content-Type':'application/json'}, body: JSON.stringify({messaging_product:'whatsapp', to, ...payload})});
  const data = await r.text(); console.log('ENVIO', r.status, data); return data;
}
function enviarTexto(to, body){ return enviar(to, {type:'text', text:{body}}); }
function enviarLista(to, body, button, sections){ return enviar(to, {type:'interactive', interactive:{type:'list', body:{text:body}, action:{button, sections}}}); }

function menuPrincipal(to, nombre){
  return enviarLista(to, `Gracias ${nombre}! Ya tengo tus datos.\n\nQue necesitas?`, 'Menu de opciones',
  [{title:'ANCA Marketplace', rows:[
    {id:'menu_instalado', title:'Suministro e Instalado', description:'Equipo + instalado, con garantia'},
    {id:'menu_solo_equipo', title:'Solo equipo', description:'Solo suministro, sin instalacion'},
    {id:'menu_asesor', title:'Hablar con asesor', description:'Te atiende una persona de ANCA'}
  ]}]);
}
function menuVoltaje(to){
  return enviarLista(to, 'Que voltaje tenes en tu casa?', 'Ver voltaje',
  [{title:'Voltaje', rows:[
    {id:'volt_110V', title:'110 Voltios', description:'Enchufe normal de casa'},
    {id:'volt_220V', title:'220 Voltios', description:'Enchufe especial / grueso'},
    {id:'volt_nose', title:'No se', description:'Te muestro todos'}
  ]}]);
}
function menuBtu(to, modo, recomendado){
  return enviarLista(to, `Segun tus medidas, te recomiendo *${recomendado} BTU*.\n\nQueres ver esos o otra capacidad?`, 'Ver capacidades',
  [{title:'Capacidades', rows:[
    {id:`btu_6000_${modo}`, title:'6,000 BTU', description:'Cuarto pequeno'},
    {id:`btu_12000_${modo}`, title:'12,000 BTU', description:'Cuarto / sala pequena'},
    {id:`btu_18000_${modo}`, title:'18,000 BTU', description:'Sala mediana'},
    {id:`btu_24000_${modo}`, title:'24,000 BTU', description:'Sala grande'},
    {id:`btu_36000_${modo}`, title:'36,000 BTU', description:'Local / area grande'},
    {id:`btu_60000_${modo}`, title:'60,000 BTU', description:'Piso-Techo / Cassette'}
  ]}]);
}
function menuEquipos(to, btu, modo, voltaje){
  let filtrados = PRODUCTOS.filter(p=>p.btu===btu);
  if(voltaje && voltaje!=='nose') filtrados = filtrados.filter(p=>p.voltaje===voltaje);
  if(filtrados.length===0) filtrados = PRODUCTOS.filter(p=>p.btu===btu);
  const rows = filtrados.slice(0,10).map(p=>{
    const precio = modo==='instalado' ? p.instalado : p.suministro;
    const tipoCorto = p.tipo==='PISO-TECHO' ? 'P-TECHO' : p.tipo;
    return {id:`prod_${p.id}_${modo}`, title:`${p.marca} ${tipoCorto} ${p.btu}`, description:`${p.modelo} | ${p.voltaje} | ${p.seer} | ${fmt(precio)}`};
  });
  return enviarLista(to, `Para ${btu} BTU ${voltaje && voltaje!=='nose' ? 'en '+voltaje : ''} tenemos ${modo==='instalado' ? 'con instalacion' : 'solo equipo'}:`, 'Ver equipos', [{title:`Equipos ${btu} BTU`, rows}]);
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
function recomendarBtu(m2){
  if(m2<=12) return 12000; if(m2<=18) return 12000; if(m2<=24) return 18000; if(m2<=36) return 24000; if(m2<=50) return 36000; return 60000;
}
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
    let st = estado[from] || {paso:'inicio'};
    let textoRaw = msg.text?.body?.trim() || '';
    let texto = textoRaw.toLowerCase();
    let listId = msg.interactive?.list_reply?.id || '';

    // Si dice REINICIAR, empieza de cero
    if(texto==='reiniciar' || texto==='menu'){
      estado[from]={paso:'nombre'};
      await enviarTexto(from, 'Hola! Soy tu asistente de ANCA Marketplace.\n\nPara darte una cotizacion exacta, como te llamas? Nombre y apellido por favor.');
      return res.sendStatus(200);
    }

    // UBICACION - SOLO AL FINAL
    if(msg.type==='location'){
      const {dist, costo} = calcularKm(msg.location.latitude, msg.location.longitude);
      const p = PRODUCTOS.find(x=>x.id===st.productoId);
      if(p && st.modo==='instalado'){
        const total = p.instalado + costo;
        console.log(`LEAD ANCA - Nombre: ${st.nombre} | Tel: ${from} | Vive: ${st.ubicacionTexto} | Medidas: ${st.m2} m2 | Voltaje: ${st.voltaje} | Equipo: ${p.marca} ${p.modelo} | Dist: ${dist} km | Total: ${fmt(total)}`);
        await enviarTexto(from, `Gracias ${st.nombre}!\n\nTu cotizacion final:\n*${p.marca} ${p.tipo} ${p.btu} BTU*\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\nPrecio con instalacion: ${fmt(p.instalado)}\nDistancia desde ANCA: ${dist} km\n${costo>0 ? `Kilometraje extra: ${fmt(costo)} (${dist} km - 20 km gratis x C$16)\n` : 'Kilometraje: C$0 (dentro de los 20 km gratis)\n'}*TOTAL A PAGAR: ${fmt(total)}*\n\nIncluye instalacion basica, base, sellado y protector de voltaje de cortesia.\nGarantia: 18 meses compresor, 1 ano partes.\n\nLo apartamos? Escribi *SI* para apartarlo.`);
      }
      estado[from] = {...st, paso:'esperando_si'};
      return res.sendStatus(200);
    }

    // PASO 1: NOMBRE - obligatorio, no se puede saltar
    if(st.paso==='inicio'){
      estado[from]={paso:'nombre'};
      await enviarTexto(from, 'Hola! Soy tu asistente virtual de ANCA Marketplace.\n\nPara ayudarte con tu cotizacion, como te llamas? Nombre y apellido por favor.');
      return res.sendStatus(200);
    }
    if(st.paso==='nombre'){
      if(textoRaw.length < 3 || texto==='hola'){
        await enviarTexto(from, 'Decime tu nombre y apellido por favor, asi te atiendo mejor. Ej: Juan Perez');
        return res.sendStatus(200);
      }
      st.nombre = textoRaw; st.paso='donde_vive'; estado[from]=st;
      await enviarTexto(from, `Mucho gusto ${st.nombre}! 😊\n\nDonde vivis? Decime tu barrio y municipio. Ej: Altos de Motastepe, Managua`);
      return res.sendStatus(200);
    }
    if(st.paso==='donde_vive'){
      st.ubicacionTexto = textoRaw; st.paso='medidas'; estado[from]=st;
      await enviarTexto(from, `Perfecto ${st.nombre}, anotado: ${st.ubicacionTexto}.\n\nAhora, para recomendarte la capacidad correcta, que medidas tiene el cuarto a climatizar?\n\nEscribilo asi: *4 x 3* (largo x ancho en metros)`);
      return res.sendStatus(200);
    }
    if(st.paso==='medidas'){
      const nums = textoRaw.replace(',','.').match(/(\d+(\.\d+)?)/g);
      let m2 = 0;
      if(nums && nums.length>=2) m2 = parseFloat(nums[0])*parseFloat(nums[1]);
      else if(nums && nums.length===1) m2 = parseFloat(nums[0]);
      if(!m2){ await enviarTexto(from, 'No te entendi la medida. Escribila asi porfa: *4 x 3*'); return res.sendStatus(200); }
      st.m2 = m2; st.btuRecomendado = recomendarBtu(m2); st.paso='voltaje'; estado[from]=st;
      await enviarTexto(from, `Entendido, ${m2} m2. Para ese espacio te recomiendo *${st.btuRecomendado} BTU*.`);
      await menuVoltaje(from);
      return res.sendStatus(200);
    }
    if(listId.startsWith('volt_')){
      st.voltaje = listId.replace('volt_',''); st.paso='menu_principal'; estado[from]=st;
      await menuPrincipal(from, st.nombre);
      return res.sendStatus(200);
    }
    // Si esta en paso voltaje y escribe texto, volver a pedir voltaje
    if(st.paso==='voltaje' && !listId){ await menuVoltaje(from); return res.sendStatus(200); }
    // Si esta en paso menu y no ha elegido, no dejar avanzar
    if(st.paso==='menu_principal' && !listId){
      await menuPrincipal(from, st.nombre); return res.sendStatus(200);
    }

    if(listId==='menu_instalado'){ st.modo='instalado'; st.paso='btu'; estado[from]=st; await menuBtu(from,'instalado', st.btuRecomendado); return res.sendStatus(200); }
    if(listId==='menu_solo_equipo'){ st.modo='suministro'; st.paso='btu'; estado[from]=st; await menuBtu(from,'suministro', st.btuRecomendado); return res.sendStatus(200); }
    if(listId==='menu_asesor'){
      console.log(`LEAD ANCA - Nombre: ${st.nombre} | Tel: ${from} | Vive: ${st.ubicacionTexto} | Medidas: ${st.m2} m2 | Voltaje: ${st.voltaje} | Quiere asesor`);
      await enviarTexto(from, `Perfecto ${st.nombre}, en un momento te atiende un asesor.\n\nYa tenemos tus datos:\nNombre: ${st.nombre}\nVive en: ${st.ubicacionTexto}\nMedidas: ${st.m2} m2\nVoltaje: ${st.voltaje}\n\nGracias!`);
      return res.sendStatus(200);
    }
    if(listId.startsWith('btu_')){
      const partes = listId.split('_'); const btu = parseInt(partes[1]); const modo = partes[2];
      st={...st, modo, btu, paso:'equipo'}; estado[from]=st;
      await menuEquipos(from, btu, modo, st.voltaje);
      return res.sendStatus(200);
    }
    if(listId.startsWith('prod_')){
      const partes = listId.split('_'); const prodId = partes[1]; const modo = partes[2];
      st={...st, modo, productoId: prodId, paso:'ubicacion_final'}; estado[from]=st;
      const p = PRODUCTOS.find(x=>x.id===prodId);
      if(modo==='instalado'){
        await enviarTexto(from, `Excelente eleccion ${st.nombre}!\n*${p.marca} ${p.tipo} ${p.btu} BTU*\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\nPrecio con instalacion base: ${fmt(p.instalado)}\n\nPara darte el total exacto, mandame tu ubicacion por WhatsApp:\nAdjuntar > Ubicacion > Enviar ubicacion actual 📍`);
      } else {
        await enviarTexto(from, `Excelente eleccion ${st.nombre}!\n*${p.marca} ${p.tipo} ${p.btu} BTU*\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\n*TOTAL SOLO EQUIPO: ${fmt(p.suministro)}*\nIncluye equipo nuevo en caja, garantia 18 meses compresor y 1 ano partes, envio en Managua.\n\nLo apartamos? Escribi *SI*.`);
        st.paso='esperando_si'; estado[from]=st;
      }
      return res.sendStatus(200);
    }
    if(st.paso==='esperando_si' && (texto==='si' || texto==='sí')){
      const p = PRODUCTOS.find(x=>x.id===st.productoId);
      console.log(`VENTA APARTADA - Nombre: ${st.nombre} | Tel: ${from} | Equipo: ${p?.marca} ${p?.modelo} | Vive: ${st.ubicacionTexto}`);
      await enviarTexto(from, `Listo ${st.nombre}! Apartado ✅\n\nUn asesor de ANCA te va a contactar para confirmar.\n\nTus datos:\nNombre: ${st.nombre}\nVive en: ${st.ubicacionTexto}\nEquipo: ${p?.marca} ${p?.modelo}\n\nGracias por elegir ANCA Marketplace!`);
      estado[from]={paso:'inicio'};
      return res.sendStatus(200);
    }
    // Fallback segun paso actual
    if(!st.nombre){ estado[from]={paso:'nombre'}; await enviarTexto(from, 'Hola! Para ayudarte, como te llamas? Nombre y apellido por favor.'); }
    else await menuPrincipal(from, st.nombre);
    return res.sendStatus(200);
  } catch(e){ console.log('ERROR WEBHOOK', e); return res.sendStatus(200); }
});
app.get('/', (req,res)=>res.send('Bot ANCA activo'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('ANCA corriendo en puerto '+PORT));
