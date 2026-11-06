// BOT ANCA - v15 JS para Render - Menu tipo LAFISE
const express = require('express');
const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'anca123';

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
  await fetch(url, {
    method:'POST',
    headers:{Authorization:`Bearer ${WHATSAPP_TOKEN}`, 'Content-Type':'application/json'},
    body: JSON.stringify({messaging_product:'whatsapp', to, ...payload})
  });
}
function enviarTexto(to, body){
  return enviar(to, {type:'text', text:{body}});
}
function enviarLista(to, body, button, sections){
  return enviar(to, {type:'interactive', interactive:{type:'list', body:{text:body}, action:{button, sections}}});
}

function menuPrincipal(to){
  return enviarLista(to,
    '¡Hola, soy tu asistente virtual de ANCA Marketplace! ❄️ Puedo ayudarte con cotizaciones 24/7.\n\nTe invito a seleccionar una opción 👇',
    'Menú de opciones ✅',
    [{title:'ANCA Marketplace', rows:[
      {id:'menu_instalado', title:'Suministro e Instalación ❄️', description:'Equipo + instalado, con garantía'},
      {id:'menu_solo_equipo', title:'Solo equipo 📦', description:'Solo suministro, sin instalación'},
      {id:'menu_asesor', title:'Hablar con asesor 👨‍💼', description:'Te atiende una persona de ANCA'}
    ]}]
  );
}
function menuBtu(to, modo){
  return enviarLista(to,
    `Perfecto, elegiste ${modo==='instalado' ? 'Suministro e Instalación' : 'Solo equipo'}.\n\n¿Qué capacidad necesita?`,
    'Ver capacidades ✅',
    [{title:'Capacidades disponibles', rows:[
      {id:`btu_6000_${modo}`, title:'6,000 BTU', description:'Para cuarto pequeño'},
      {id:`btu_12000_${modo}`, title:'12,000 BTU', description:'Para cuarto / sala pequeña'},
      {id:`btu_18000_${modo}`, title:'18,000 BTU', description:'Para sala mediana'},
      {id:`btu_24000_${modo}`, title:'24,000 BTU', description:'Para sala grande'},
      {id:`btu_36000_${modo}`, title:'36,000 BTU', description:'Para local / área grande'},
      {id:`btu_60000_${modo}`, title:'60,000 BTU', description:'Piso-Techo / Cassette'}
    ]}]
  );
}
function menuEquipos(to, btu, modo){
  const filtrados = PRODUCTOS.filter(p=>p.btu===btu);
  const rows = filtrados.map(p=>{
    const precio = modo==='instalado' ? p.instalado : p.suministro;
    return {id:`prod_${p.id}_${modo}`, title:`${p.marca} ${p.tipo} ${p.btu} BTU`, description:`${p.modelo} | ${p.voltaje} | ${p.inverter} | ${p.seer} | ${fmt(precio)}`};
  });
  return enviarLista(to,
    `Para ${btu} BTU tenemos ${modo==='instalado' ? 'con instalación' : 'solo equipo'}:\n\nTocá el equipo que te interesa 👇`,
    'Ver equipos ✅',
    [{title:`Equipos ${btu} BTU`, rows}]
  );
}

function haversine(lat1, lon1, lat2, lon2){
  const R=6371;
  const dlat=(lat2-lat1)*Math.PI/180;
  const dlon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dlat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dlon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
function calcularKm(lat, lon){
  const dist = Math.round(haversine(ANCA_LAT, ANCA_LON, lat, lon)*1.3*10)/10;
  if(dist<=KM_GRATIS) return {dist, costo:0};
  return {dist, costo: Math.round((dist-KM_GRATIS)*PRECIO_KM_EXTRA)};
}

// Memoria simple por número
const estado = {};

app.get('/webhook', (req,res)=>{
  const mode=req.query['hub.mode'];
  const token=req.query['hub.verify_token'];
  const challenge=req.query['hub.challenge'];
  if(mode==='subscribe' && token===VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

app.post('/webhook', async (req,res)=>{
  try{
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if(!msg) return res.sendStatus(200);
    const from = msg.from;
    const st = estado[from] || {};

    // Ubicación del cliente
    if(msg.type==='location'){
      const {dist, costo} = calcularKm(msg.location.latitude, msg.location.longitude);
      const p = PRODUCTOS.find(x=>x.id===st.productoId);
      if(p && st.modo==='instalado'){
        const precioBase = p.instalado;
        const total = precioBase + costo;
        await enviarTexto(from,
          `Perfecto, eligió:\n*${p.marca} ${p.tipo} ${p.btu} BTU*\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\n*Precio con instalación incluye:*\n• Servicio de instalación básica\n• Material de fijación\n• Sellado\n• Base de la unidad condensadora\n• Protector de voltaje de cortesía\n\n*Garantía:* 18 meses en compresor y 1 año en partes\n*Envío:* Hasta la puerta de su casa en Managua\n\nPrecio base: ${fmt(precioBase)}\nDistancia desde ANCA: ${dist} km\n${costo>0 ? `Kilometraje: (${dist} - 20) x C$16 = ${fmt(costo)}\n` : 'Kilometraje: C$0 (dentro de los 20 km gratis)\n'}*TOTAL A PAGAR: ${fmt(total)}*\n\n¿Le apartamos este equipo? Escriba *SI* para apartarlo.`
        );
      }
      return res.sendStatus(200);
    }

    let texto = msg.text?.body?.trim().toLowerCase() || '';
    let listId = msg.interactive?.list_reply?.id || '';

    if(listId==='menu_instalado' || texto==='1'){ estado[from]={modo:'instalado'}; await menuBtu(from,'instalado'); }
    else if(listId==='menu_solo_equipo' || texto==='2'){ estado[from]={modo:'suministro'}; await menuBtu(from,'suministro'); }
    else if(listId==='menu_asesor'){ await enviarTexto(from,'Perfecto, en un momento le atiende un asesor de ANCA. ¿Me deja su nombre por favor?'); }
    else if(listId.startsWith('btu_')){
      const partes = listId.split('_'); // btu_12000_instalado
      const btu = parseInt(partes[1]);
      const modo = partes[2];
      estado[from]={...st, modo, btu};
      await menuEquipos(from, btu, modo);
    }
    else if(listId.startsWith('prod_')){
      const partes = listId.split('_'); // prod_p10_instalado
      const prodId = partes[1];
      const modo = partes[2];
      estado[from]={...st, modo, productoId: prodId};
      const p = PRODUCTOS.find(x=>x.id===prodId);
      if(modo==='instalado'){
        await enviarTexto(from,
          `*Importante sobre el kilometraje:*\nEn ANCA, la instalación dentro de Managua y alrededores hasta 20 km desde nuestra tienda en Km 9 Carretera Nueva a León, Residencial Altos de Motastepe, es *sin costo de kilometraje*.\n\nSi su instalación es *fuera de Managua, a más de 20 km*, se agrega *C$16 por cada km extra*.\nEjemplo: Si usted está a 40 km, son 20 km extra x C$16 = C$320.\n\nPara calcularle el costo exacto, ¿me manda su ubicación por WhatsApp? 📍\nAdjuntar > Ubicación > Enviar ubicación actual`
        );
      } else {
        await enviarTexto(from,
          `Perfecto, eligió:\n*${p.marca} ${p.tipo} ${p.btu} BTU*\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\n*Precio solo equipo incluye:*\n• Equipo completo nuevo en caja\n• Garantía: 18 meses compresor y 1 año partes\n• Envío hasta su casa en Managua\n\n*TOTAL: ${fmt(p.suministro)}*\n\n¿Le apartamos este equipo? Escriba *SI* para apartarlo.`
        );
      }
    }
    else {
      await menuPrincipal(from);
    }
    return res.sendStatus(200);
  } catch(e){ console.log(e); return res.sendStatus(200); }
});

app.get('/', (req,res)=>res.send('Bot ANCA activo'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('ANCA corriendo en puerto '+PORT));
