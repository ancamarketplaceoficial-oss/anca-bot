// BOT ANCA - v28 - ANCA ASISTENTE VIRTUAL + NO REPETIR NOMBRE + SOLO SPLIT SE INSTALA + MANTENIMIENTO 1400/1900 + PARSE NOMBRE+CEDULA
const fetch = require('node-fetch');
const express = require('express');
const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'anca2025';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OWNER_PHONE = '50589303261';

const ANCA_LAT = 12.1340;
const ANCA_LON = -86.3590;
const KM_GRATIS = 20;
const PRECIO_KM_NORMAL = 16;
const PRECIO_KM_IDA_VUELTA = 32;
const KM_IDA_VUELTA_DESDE = 80;

// PRECIOS MANTENIMIENTO
const PRECIO_PREVENTIVO = 1400;
const PRECIO_GENERAL = 1900;

const PRODUCTOS = [
  {id:"p1", marca:"GPLUS", tipo:"PORTATIL", btu:12000, modelo:"GP-P12AO", voltaje:"110V", inverter:"No", seer:"-", suministro:12825, instalado:12825, instala:false},
  {id:"p2", marca:"GPLUS", tipo:"VENTANA", btu:6000, modelo:"GP-W061MS", voltaje:"110V", inverter:"No", seer:"-", suministro:6210, instalado:6210, instala:false},
  {id:"p3", marca:"GPLUS", tipo:"VENTANA", btu:12000, modelo:"GP-W121MC", voltaje:"110V", inverter:"No", seer:"-", suministro:12825, instalado:12825, instala:false},
  {id:"p4", marca:"GPLUS", tipo:"SPLIT", btu:12000, modelo:"GP-S121C", voltaje:"110V", inverter:"No", seer:"SEER 13", suministro:11475, instalado:15275, instala:true},
  {id:"p5", marca:"GPLUS", tipo:"SPLIT", btu:12000, modelo:"GP-S122C", voltaje:"220V", inverter:"No", seer:"SEER 13", suministro:10395, instalado:14195, instala:true},
  {id:"p6", marca:"GPLUS", tipo:"SPLIT", btu:18000, modelo:"GP-S182C", voltaje:"220V", inverter:"No", seer:"SEER 14", suministro:18900, instalado:22700, instala:true},
  {id:"p7", marca:"GPLUS", tipo:"SPLIT", btu:24000, modelo:"GP-S242C", voltaje:"220V", inverter:"No", seer:"SEER 14", suministro:22950, instalado:28550, instala:true},
  {id:"p8", marca:"GPLUS", tipo:"SPLIT", btu:36000, modelo:"GP-S362C", voltaje:"220V", inverter:"No", seer:"SEER 14", suministro:35100, instalado:42600, instala:true},
  {id:"p9", marca:"GPLUS", tipo:"PISO-TECHO", btu:60000, modelo:"GP-60PT", voltaje:"220V", inverter:"No", seer:"SEER 13", suministro:67500, instalado:82300, instala:true},
  {id:"p10", marca:"GPLUS", tipo:"SPLIT", btu:12000, modelo:"GP-S12000INV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:13230, instalado:17030, instala:true},
  {id:"p11", marca:"GPLUS", tipo:"SPLIT", btu:18000, modelo:"GP-S18000INV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:21060, instalado:24860, instala:true},
  {id:"p12", marca:"GPLUS", tipo:"SPLIT", btu:24000, modelo:"GP-S24000INV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:25650, instalado:31250, instala:true},
  {id:"p13", marca:"GPLUS", tipo:"SPLIT", btu:36000, modelo:"GP-S36000INV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:41850, instalado:49350, instala:true},
  {id:"p14", marca:"GPLUS", tipo:"PISO-TECHO", btu:60000, modelo:"GP-60PTINV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:72900, instalado:87700, instala:true},
  {id:"p15", marca:"GPLUS", tipo:"CASSETTE", btu:60000, modelo:"GP-60CTINV", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 17", suministro:88425, instalado:103225, instala:true},
  {id:"p16", marca:"LG", tipo:"SPLIT", btu:12000, modelo:"VX121C1", voltaje:"110V", inverter:"Si - DUAL INVERTER", seer:"SEER 18", suministro:18225, instalado:22025, instala:true},
  {id:"p17", marca:"HISENSE", tipo:"SPLIT", btu:12000, modelo:"AC122CE", voltaje:"220V", inverter:"No - ESTANDAR", seer:"SEER 14", suministro:10395, instalado:14195, instala:true},
  {id:"p18", marca:"HISENSE", tipo:"SPLIT", btu:12000, modelo:"ATR121KA", voltaje:"110V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:14715, instalado:18515, instala:true},
  {id:"p19", marca:"HISENSE", tipo:"SPLIT", btu:12000, modelo:"ATR122CJ", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:13230, instalado:17030, instala:true},
  {id:"p20", marca:"HISENSE", tipo:"SPLIT", btu:18000, modelo:"ATR182CJ", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:21060, instalado:24860, instala:true},
  {id:"p21", marca:"HISENSE", tipo:"SPLIT", btu:24000, modelo:"ATR242CJ", voltaje:"220V", inverter:"Si - INVERTER", seer:"SEER 18", suministro:25650, instalado:31250, instala:true},
];

function fmt(n){ return 'C$' + n.toLocaleString('en-US'); }
function fmt2(n){ return 'C$ ' + n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}); }
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
  if(dist<=KM_IDA_VUELTA_DESDE) return {dist, costo: Math.round((dist-KM_GRATIS)*PRECIO_KM_NORMAL)};
  const tramoNormal = (KM_IDA_VUELTA_DESDE - KM_GRATIS) * PRECIO_KM_NORMAL;
  const tramoIdaVuelta = (dist - KM_IDA_VUELTA_DESDE) * PRECIO_KM_IDA_VUELTA;
  return {dist, costo: Math.round(tramoNormal + tramoIdaVuelta)};
}

// === NUEVO v28: SEPARAR NOMBRE + CEDULA / RUC EN EL MISMO MENSAJE ===
function parseNombreRuc(textoRaw){
  let txt = textoRaw.trim();
  // Busca cedula: 001-190302-1056Q / 0011903021056Q / 001 190302 1056Q / J0310000000000
  const regexCedula = /(\d{3}[-\s]?\d{6}[-\s]?\d{4}[A-Z]|[Jj]\d{13}|\d{14}[A-Z]?)/;
  const m = txt.match(regexCedula);
  let ruc = null, nombre = txt;
  if(m){
    ruc = m[0].toUpperCase().replace(/\s/g,'');
    // Quita la cedula del texto, lo que queda es el nombre
    nombre = txt.replace(m[0],'').replace(/,|mi nombre es|mi cedula es|mi ruc es|cedula|ruc|:|es/gi,' ').replace(/\s+/g,' ').trim();
    // Limpia saltos de linea
    nombre = nombre.split('\n').map(s=>s.trim()).filter(Boolean).join(' ');
    // Si el nombre quedo con la cedula en otra linea, limpiarlo
    if(nombre.length < 3) nombre = null;
  } else {
    // Si no hay cedula, pero viene "Nombre, RUC" con coma
    if(txt.includes(',')){
      const partes = txt.split(',');
      if(partes.length >= 2){ nombre = partes[0].trim(); ruc = partes[1].trim().toUpperCase(); }
    }
  }
  // Capitaliza nombre
  if(nombre) nombre = nombre.split(' ').map(w=> w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ');
  return {nombre, ruc};
}

function textoCierre(){ return `\n\n¿Cómo desea continuar?\n\nResponda con el número:\n1. Hablar con un asesor de ventas para cerrar la venta\n2. Apartar el equipo`; }
function descripcionProforma(p, modo){
  const eficiencia = p.inverter.toLowerCase().includes('inverter') ? 'Inverter' : 'Convencional';
  const tipoServicio = modo==='instalado' ? 'Suministro e instalación' : 'Suministro';
  return `${tipoServicio}\nAires Acondicionados\nMarca / ${p.marca}\nCapacidad / ${p.btu.toLocaleString('en-US')} BTU\nEficiencia / ${eficiencia}\nVoltaje / ${p.voltaje} - 50Hz`;
}
function leadProforma(st, p, total, accion){
  const cantidad = st.cantidad || 1;
  const unit = total / cantidad;
  const desc = p ? descripcionProforma(p, st.modo) : `Mantenimiento ${st.tipoMantenimiento || ''}`;
  return `LEAD PARA PROFORMA ANCA\n\nCLIENTE: ${st.nombreCompleto}\nCED / RUC: ${st.rucCedula}\nMONEDA: C$\n\nDESCRIPCION PARA TU PROFORMA:\n${desc}\n\nCANTIDAD: ${String(cantidad).padStart(2,'0')} Unidad(es)\nPRECIO: ${fmt2(unit)}\nTOTAL: ${fmt2(total)}\nSUBTOTAL: ${fmt2(total)}\nDESCUENTO: ${fmt2(0)}\nTOTAL: ${fmt2(total)}\n\nUBICACION: ${st.ubicacionTexto}\nQUIERE: ${accion}\nACCION: Copiar en tu proforma AC y enviar PDF`;
}

async function cerebroIA(mensajeCliente, datosActuales){
  if(!GEMINI_API_KEY) return null;
  const catalogoTexto = PRODUCTOS.map(p=>`${p.marca} ${p.tipo} ${p.btu}BTU ${p.voltaje} ${p.modelo} Suministro:${p.suministro} Instalado:${p.instalado} Instala:${p.instala?'SI':'NO'}`).join('\n');
  const prompt = `Eres Anca, asistente virtual de ANCA Marketplace. Hablas de usted, formal, sin decir "Estimado", sin inventar.
REGLAS: Solo ofrece equipos de este catalogo: ${catalogoTexto}
REGLA INSTALACION: Solo SPLIT, PISO-TECHO y CASSETTE se instalan. VENTANA y PORTATIL NO se instalan, solo se vende el equipo.
REGLA VOLTAJE: 6000 y 12000 BTU en 110V y 220V. 18000 en adelante SOLO 220V.
Precios exactos del catalogo, nunca inventes.
NUNCA hables de costo de kilometraje, ni de C$16, ni de C$32, ni de km gratis. Eso es interno. Solo pide ubicacion para calcular total.
MANTENIMIENTO: Preventivo C$1400, General C$1900 por unidad.
DATOS: ${JSON.stringify(datosActuales)}
MENSAJE: "${mensajeCliente}"
Devuelve SOLO JSON: {"nombre":"o null","nombreCompleto":"o null","rucCedula":"o null","ubicacionTexto":"o null","m2":"numero o null","btuSolicitado":"numero o null","voltaje":"110V o 220V o null","marcaSolicitada":"o null","tipoSolicitado":"o null","servicio":"equipo_instalado, solo_equipo, mantenimiento, reparacion, gas, traslado, repuestos, empresas, asesor o null","cantidad":"numero o null","quiereEnvio":"si, no, retiro o null","detalleServicio":"o null","tipoMantenimiento":"preventivo, general o null","tiempoSinMantenimiento":"o null"}`;
  try{
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({contents:[{parts:[{text: prompt}]}]})});
    const j = await r.json(); const txt = j.candidates?.[0]?.content?.parts?.[0]?.text || ''; const m = txt.match(/\{[\s\S]*\}/); if(!m) return null; return JSON.parse(m[0]);
  }catch(e){ console.log('IA ERROR', e); return null; }
}

async function enviar(to, payload){
  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
  const r = await fetch(url, {method:'POST', headers:{Authorization:`Bearer ${WHATSAPP_TOKEN}`, 'Content-Type':'application/json'}, body: JSON.stringify({messaging_product:'whatsapp', to, ...payload})});
  const data = await r.text(); console.log('ENVIO', r.status, data); return data;
}
function enviarTexto(to, body){ return enviar(to, {type:'text', text:{body}}); }
async function enviarLeadDueno(mensajeLead, telefonoCliente){
  try{ await enviarTexto(OWNER_PHONE, `NUEVO LEAD - ANCA\n\n${mensajeLead}\n\nTELEFONO CLIENTE: +${telefonoCliente}\nPara responderle, escribale directo a ese numero.`); }catch(e){ console.log('ERROR LEAD DUEÑO', e); }
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

    if(texto==='reiniciar'){
      estado[from]={paso:'nombre'};
      await enviarTexto(from, 'Hola, soy Anca, asistente virtual de ANCA Marketplace.\n\n¿Con quién tengo el gusto? Me indica su nombre y apellido, por favor.');
      return res.sendStatus(200);
    }

    // CIERRE VENTA
    if(st.paso==='cierre_venta'){
      const p = PRODUCTOS.find(x=>x.id===st.productoId);
      const cantidad = st.cantidad || 1;
      const unit = st.modo==='instalado' ? p?.instalado : p?.suministro;
      const total = st.totalFinal || (unit * cantidad + (st.costoKm||0));
      if(texto==='1' || texto.includes('asesor') || texto.includes('hablar') || texto.includes('cerrar')){
        const lead = leadProforma(st, p, total, 'HABLAR CON ASESOR PARA CERRAR + PDF');
        console.log(lead); await enviarLeadDueno(lead, from);
        await enviarTexto(from, `Perfecto. Un asesor de ventas de ANCA le contactará en breve para cerrar su venta y enviarle su cotización formal en PDF.\n\nResumen:\nNombre: ${st.nombreCompleto}\nRUC / Cédula: ${st.rucCedula}\nEquipo: ${p?.marca} ${p?.modelo}\nCantidad: ${cantidad}\nTotal: ${fmt(total)}\nUbicación: ${st.ubicacionTexto}\n\nGracias por elegir ANCA Marketplace.`);
        estado[from]={paso:'inicio'}; return res.sendStatus(200);
      }
      if(texto==='2' || texto==='si' || texto==='sí' || texto.includes('apartar')){
        const lead = leadProforma(st, p, total, 'APARTAR + PDF');
        console.log(lead); await enviarLeadDueno(lead, from);
        await enviarTexto(from, `Listo. Su pedido quedó apartado.\n\nResumen:\nA nombre de: ${st.nombreCompleto}\nRUC / Cédula: ${st.rucCedula}\nUbicación: ${st.ubicacionTexto}\nEquipo: ${p?.marca} ${p?.modelo}\nCantidad: ${cantidad}\nTotal: ${fmt(total)}\n\nUn asesor de ANCA le contactará para confirmar su pedido y enviarle su cotización en PDF.\n\nGracias por elegir ANCA Marketplace.`);
        estado[from]={paso:'inicio'}; return res.sendStatus(200);
      }
      await enviarTexto(from, `¿Cómo desea continuar?\n\nResponda con el número:\n1. Hablar con un asesor de ventas para cerrar la venta\n2. Apartar el equipo`);
      return res.sendStatus(200);
    }

    // CIERRE MANTENIMIENTO
    if(st.paso==='cierre_mantenimiento'){
      const precioUnit = st.tipoMantenimiento==='general' ? PRECIO_GENERAL : PRECIO_PREVENTIVO;
      const total = precioUnit * (st.cantidad||1) + (st.costoKm||0);
      if(texto==='1' || texto.includes('asesor')){
        const lead = `LEAD MANTENIMIENTO - ANCA\n\nCLIENTE: ${st.nombreCompleto}\nCED / RUC: ${st.rucCedula}\nTIPO: ${st.tipoMantenimiento?.toUpperCase()} - ${fmt(precioUnit)} c/u\nCANTIDAD: ${st.cantidad}\nTOTAL: ${fmt(total)}\nTIEMPO SIN MANTENIMIENTO: ${st.tiempoSinMantenimiento}\nDETALLE: ${st.detalle}\nUBICACION: ${st.ubicacionTexto}\nQUIERE: HABLAR CON ASESOR + PDF`;
        console.log(lead); await enviarLeadDueno(lead, from);
        await enviarTexto(from, `Perfecto. Un asesor de ANCA le contactará para agendar su mantenimiento y enviarle su cotización en PDF.\n\nResumen:\nMantenimiento ${st.tipoMantenimiento} - ${fmt(precioUnit)} c/u\nCantidad: ${st.cantidad}\nTotal: ${fmt(total)}\n\nGracias por elegir ANCA Marketplace.`);
        estado[from]={paso:'inicio'}; return res.sendStatus(200);
      }
      if(texto==='2' || texto.includes('apartar') || texto==='si'){
        const lead = `LEAD MANTENIMIENTO - ANCA\n\nCLIENTE: ${st.nombreCompleto}\nCED / RUC: ${st.rucCedula}\nTIPO: ${st.tipoMantenimiento?.toUpperCase()}\nCANTIDAD: ${st.cantidad}\nTOTAL: ${fmt(total)}\nUBICACION: ${st.ubicacionTexto}\nQUIERE: APARTAR / AGENDAR + PDF`;
        console.log(lead); await enviarLeadDueno(lead, from);
        await enviarTexto(from, `Listo. Su mantenimiento quedó apartado.\n\nUn asesor le contactará para agendar fecha y enviarle su cotización en PDF.`);
        estado[from]={paso:'inicio'}; return res.sendStatus(200);
      }
      await enviarTexto(from, `¿Cómo desea continuar?\n\n1. Hablar con un asesor para agendar\n2. Apartar / Agendar`);
      return res.sendStatus(200);
    }

    if(msg.type==='location'){
      const {dist, costo} = calcularKm(msg.location.latitude, msg.location.longitude);
      const p = PRODUCTOS.find(x=>x.id===st.productoId);
      const cantidad = st.cantidad || 1;
      // Si es venta y aun no tiene datos fiscales, pedir datos sin repetir nombre
      if(!st.nombreCompleto && (st.servicio==='equipo_instalado' || st.servicio==='solo_equipo' || st.servicio==='empresas' || st.servicio==='repuestos')){
        st.distKm = dist; st.costoKm = costo; st.paso='datos_fiscales'; estado[from]=st;
        await enviarTexto(from, `Gracias.\n\nPara dejarle su cotización formal a su nombre, ¿me indica su nombre completo y su RUC o cédula, por favor? Puede mandarlos juntos en un solo mensaje.`);
        return res.sendStatus(200);
      }
      if(st.paso==='ubicacion_final_mantenimiento' || st.servicio==='mantenimiento'){
        st.distKm = dist; st.costoKm = costo;
        const precioUnit = st.tipoMantenimiento==='general' ? PRECIO_GENERAL : PRECIO_PREVENTIVO;
        const total = precioUnit * cantidad + costo;
        st.totalFinal = total;
        await enviarTexto(from, `COTIZACIÓN - ANCA MARKETPLACE\n\nA nombre de: ${st.nombreCompleto || st.nombre}\nRUC / Cédula: ${st.rucCedula}\nUbicación: ${st.ubicacionTexto}\n\nServicio: Mantenimiento ${st.tipoMantenimiento}\n${st.tipoMantenimiento==='general' ? 'Incluye: Desmontaje, lavado profundo con hidrolavadora, limpieza de turbina y serpentín, limpieza de drenaje, revisión eléctrica, revisión de gas y revisión completa.\n' : 'Incluye: Limpieza de filtros, limpieza superficial de serpentín, revisión de presión, revisión de drenaje, revisión general.\n'}\nTiempo sin mantenimiento: ${st.tiempoSinMantenimiento}\nDetalle: ${st.detalle}\n\nCantidad: ${cantidad} unidad(es)\nPrecio unitario: ${fmt(precioUnit)}\nTOTAL A PAGAR: ${fmt(total)}\n\n¿Cómo desea continuar?\n\n1. Hablar con un asesor para agendar\n2. Apartar / Agendar`);
        estado[from]={...st, paso:'cierre_mantenimiento'}; return res.sendStatus(200);
      }
      if(p && st.modo==='instalado'){
        const subtotal = p.instalado * cantidad; const total = subtotal + costo;
        st.totalFinal = total; st.costoKm = costo; st.distKm = dist;
        await enviarTexto(from, `COTIZACIÓN - ANCA MARKETPLACE\n\nA nombre de: ${st.nombreCompleto || st.nombre}\n${st.rucCedula ? `RUC / Cédula: ${st.rucCedula}\n` : ''}Ubicación: ${st.ubicacionTexto}\n\nEquipo: ${p.marca} ${p.tipo} ${p.btu} BTU\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\nCantidad: ${cantidad} unidad(es)\nPrecio unitario con instalación: ${fmt(p.instalado)}\nTOTAL A PAGAR: ${fmt(total)}\n\nIncluye instalación, base, sellado y protector de voltaje de cortesía.\nGarantía: 18 meses en compresor, 1 año en partes.${textoCierre()}`);
        estado[from]={...st, paso:'cierre_venta'};
      } else if(p && st.modo==='suministro'){
        const subtotal = p.suministro * cantidad; let costoEnvio = st.quiereEnvio==='si' ? costo : 0; const total = subtotal + costoEnvio;
        st.totalFinal = total; st.costoKm = costoEnvio;
        await enviarTexto(from, `COTIZACIÓN - ANCA MARKETPLACE\n\nA nombre de: ${st.nombreCompleto || st.nombre}\n${st.rucCedula ? `RUC / Cédula: ${st.rucCedula}\n` : ''}Ubicación: ${st.ubicacionTexto}\n\nEquipo: ${p.marca} ${p.tipo} ${p.btu} BTU\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\nCantidad: ${cantidad} unidad(es)\nPrecio unitario solo equipo: ${fmt(p.suministro)}\n${st.quiereEnvio==='si' ? 'Entrega: Envío a domicilio\n' : 'Entrega: Retiro en tienda\n'}TOTAL A PAGAR: ${fmt(total)}\n\nIncluye equipo nuevo en caja, garantía 18 meses en compresor y 1 año en partes.${textoCierre()}`);
        estado[from]={...st, paso:'cierre_venta'};
      } else if(st.servicio){
        const leadServ = `LEAD SERVICIO - ANCA\n\nCLIENTE: ${st.nombreCompleto||st.nombre}\nCED / RUC: ${st.rucCedula}\nSERVICIO: ${st.servicio}\nDETALLE: ${st.detalle || ''}\nCANTIDAD: ${st.cantidad || 1}\nUBICACION: ${st.ubicacionTexto}`;
        console.log(leadServ); await enviarLeadDueno(leadServ, from);
        await enviarTexto(from, `Su solicitud de ${st.servicio} quedó registrada.\n\nA nombre de: ${st.nombreCompleto || st.nombre}\n${st.rucCedula ? `RUC / Cédula: ${st.rucCedula}\n` : ''}Detalle: ${st.detalle || ''}\nCantidad: ${st.cantidad || 1}\nUbicación: ${st.ubicacionTexto}\n\nUn asesor de ANCA le contactará para confirmarle el costo total y enviarle su cotización en PDF.`);
      }
      return res.sendStatus(200);
    }

    if(st.paso==='inicio'){
      estado[from]={paso:'nombre'};
      await enviarTexto(from, 'Hola, soy Anca, asistente virtual de ANCA Marketplace.\n\n¿Con quién tengo el gusto? Me indica su nombre y apellido, por favor.');
      return res.sendStatus(200);
    }
    const ia = await cerebroIA(textoRaw, st);
    if(st.paso==='nombre'){
      const parsed = parseNombreRuc(textoRaw);
      const nombre = parsed.nombre || ia?.nombre || textoRaw;
      if(nombre.length < 3 || texto==='hola'){ await enviarTexto(from, 'Me indica su nombre y apellido, por favor, para atenderle mejor.'); return res.sendStatus(200); }
      st.nombre = nombre; 
      if(parsed.ruc) { st.rucCedula = parsed.ruc; st.nombreCompleto = nombre; }
      st.paso='donde_escribe'; estado[from]=st;
      await enviarTexto(from, `Mucho gusto, ${st.nombre}.\n\n¿De qué parte de Nicaragua nos escribe? ¿Es de Managua o de otro departamento?`);
      return res.sendStatus(200);
    }
    if(st.paso==='donde_escribe'){
      st.ubicacionTexto = ia?.ubicacionTexto || textoRaw; st.paso='servicio'; estado[from]=st;
      // v28: SIN REPETIR NOMBRE NI UBICACION
      await enviarTexto(from, `Perfecto, gracias. ¿En qué le podemos ayudar?\n\nResponda con el número:\n\n1. Equipo nuevo + instalación\n2. Solo equipo\n3. Mantenimiento / Limpieza\n4. Reparación / Revisión\n5. Recarga de gas\n6. Desinstalación / Traslado\n7. Repuestos / Protectores / Bases\n8. Cotización para empresas / proyectos\n9. Hablar con asesor`);
      return res.sendStatus(200);
    }
    if(st.paso==='servicio'){
      let serv = ia?.servicio || null; const num = parseInt(texto);
      if(num===1) serv='equipo_instalado'; else if(num===2) serv='solo_equipo'; else if(num===3) serv='mantenimiento'; else if(num===4) serv='reparacion'; else if(num===5) serv='gas'; else if(num===6) serv='traslado'; else if(num===7) serv='repuestos'; else if(num===8) serv='empresas'; else if(num===9) serv='asesor';
      if(!serv){ await enviarTexto(from, 'Por favor, responda con el número del servicio, del 1 al 9.'); return res.sendStatus(200); }
      st.servicio = serv; estado[from]=st;
      if(serv==='equipo_instalado' || serv==='solo_equipo'){
        st.modo = serv==='solo_equipo' ? 'suministro' : 'instalado'; st.paso='medidas'; estado[from]=st;
        await enviarTexto(from, `Con gusto le ayudamos con ${serv==='solo_equipo' ? 'solo equipo' : 'equipo nuevo + instalación'}.\n\nPara recomendarle la capacidad correcta, ¿qué medidas aproximadas tiene el ambiente a climatizar? Puede escribirlo como guste.`);
        return res.sendStatus(200);
      }
      if(serv==='mantenimiento'){
        st.paso='mantenimiento_detalle'; estado[from]=st;
        await enviarTexto(from, `Con gusto le ayudamos con mantenimiento.\n\n¿Me indica cuántos equipos son, qué tipo son y hace cuánto no les realiza mantenimiento?\n\nPor ejemplo: 2 Split de 12000 BTU, hace 8 meses.`);
        return res.sendStatus(200);
      }
      if(serv==='reparacion'){ st.paso='detalle_servicio'; estado[from]=st; await enviarTexto(from, `Con gusto le ayudamos con reparación.\n\n¿Qué le presenta su equipo? Por ejemplo: no enfría, hace ruido, bota agua. ¿Qué marca y capacidad es?`); return res.sendStatus(200); }
      if(serv==='gas'){ st.paso='detalle_servicio'; estado[from]=st; await enviarTexto(from, `Con gusto le ayudamos con recarga de gas.\n\n¿Qué equipo es? Marca, capacidad y voltaje, por favor.`); return res.sendStatus(200); }
      if(serv==='traslado'){ st.paso='detalle_servicio'; estado[from]=st; await enviarTexto(from, `Con gusto le ayudamos con desinstalación / traslado.\n\n¿De dónde a dónde sería el traslado? ¿Qué equipo es?`); return res.sendStatus(200); }
      if(serv==='repuestos'){ st.paso='detalle_servicio'; estado[from]=st; await enviarTexto(from, `Con gusto le ayudamos con repuestos.\n\n¿Qué repuesto requiere? Por ejemplo: protector de voltaje, base, control remoto, capacitor. ¿Para qué equipo es y cuántas unidades requiere?`); return res.sendStatus(200); }
      if(serv==='empresas'){ st.paso='detalle_servicio'; estado[from]=st; await enviarTexto(from, `Con gusto le ayudamos con cotización para empresas / proyectos.\n\n¿Me indica el nombre de su empresa, cuántos equipos requiere y para qué tipo de proyecto es?`); return res.sendStatus(200); }
      if(serv==='asesor'){ 
        const leadAsesor = `LEAD ASESOR DIRECTO\n\nCLIENTE: ${st.nombre}\nUBICACION: ${st.ubicacionTexto}`;
        console.log(leadAsesor); await enviarLeadDueno(leadAsesor, from);
        await enviarTexto(from, `Con gusto. Un asesor de ANCA le atenderá en breve.\n\nDatos registrados:\nNombre: ${st.nombre}\nUbicación: ${st.ubicacionTexto}\n\nGracias por escribir a ANCA Marketplace.`); return res.sendStatus(200); }
    }
    // === MANTENIMIENTO v28 ===
    if(st.paso==='mantenimiento_detalle'){
      st.detalle = ia?.detalleServicio || textoRaw;
      if(ia?.cantidad) st.cantidad = ia.cantidad; else { const n = textoRaw.match(/\d+/); if(n) st.cantidad = parseInt(n[0]); }
      st.tiempoSinMantenimiento = ia?.tiempoSinMantenimiento || textoRaw;
      st.paso='mantenimiento_tipo'; estado[from]=st;
      await enviarTexto(from, `Gracias. Tenemos 2 opciones de mantenimiento:\n\n1. PREVENTIVO - ${fmt(PRECIO_PREVENTIVO)} por unidad\nIncluye: Limpieza de filtros, limpieza superficial de serpentín, revisión de presión, revisión de drenaje y revisión general de funcionamiento.\nIdeal si le hizo mantenimiento hace menos de 6 meses.\n\n2. GENERAL - ${fmt(PRECIO_GENERAL)} por unidad\nIncluye: Desmontaje del equipo, lavado profundo con hidrolavadora, limpieza de turbina y serpentín, limpieza de drenaje, revisión eléctrica, revisión de gas y revisión completa de funcionamiento.\nIdeal si tiene más de 6 meses, más de 1 año sin mantenimiento, o nunca le ha hecho.\n\n¿Cuál prefiere? Responda 1 para Preventivo o 2 para General.`);
      return res.sendStatus(200);
    }
    if(st.paso==='mantenimiento_tipo'){
      let tipo = null;
      if(texto==='1' || texto.includes('preventivo')) tipo='preventivo';
      if(texto==='2' || texto.includes('general')) tipo='general';
      if(ia?.tipoMantenimiento) tipo = ia.tipoMantenimiento;
      if(!tipo){ await enviarTexto(from, '¿Cuál prefiere? Responda 1 para Preventivo o 2 para General.'); return res.sendStatus(200); }
      st.tipoMantenimiento = tipo;
      if(!st.cantidad){ st.paso='mantenimiento_cantidad'; estado[from]=st; await enviarTexto(from, `Perfecto, ${tipo==='general' ? 'General' : 'Preventivo'}.\n\n¿Cuántas unidades son?`); return res.sendStatus(200); }
      st.paso='datos_fiscales_mantenimiento'; estado[from]=st;
      await enviarTexto(from, `Perfecto, mantenimiento ${tipo} - ${fmt(tipo==='general'?PRECIO_GENERAL:PRECIO_PREVENTIVO)} por unidad.\n\nPara dejarle su cotización formal, ¿me indica su nombre completo y su RUC o cédula, por favor? Puede mandarlos juntos en un solo mensaje.`);
      return res.sendStatus(200);
    }
    if(st.paso==='mantenimiento_cantidad'){
      const cant = parseInt(texto) || ia?.cantidad || 1; st.cantidad = cant; st.paso='datos_fiscales_mantenimiento'; estado[from]=st;
      await enviarTexto(from, `Perfecto. Cantidad: ${cant}.\n\nPara dejarle su cotización formal, ¿me indica su nombre completo y su RUC o cédula, por favor? Puede mandarlos juntos en un solo mensaje.`);
      return res.sendStatus(200);
    }
    if(st.paso==='datos_fiscales_mantenimiento'){
      const parsed = parseNombreRuc(textoRaw);
      st.nombreCompleto = parsed.nombre || ia?.nombreCompleto || st.nombre;
      st.rucCedula = parsed.ruc || ia?.rucCedula || textoRaw;
      // Si solo mando nombre, pedir solo cedula
      if(!parsed.ruc && !ia?.rucCedula){
        // Si el texto parece solo nombre (sin numeros), pedir cedula
        if(!/\d/.test(textoRaw)){ st.paso='datos_fiscales_mantenimiento_ruc'; estado[from]=st; await enviarTexto(from, `Gracias. ¿Me indica su RUC o cédula, por favor?`); return res.sendStatus(200); }
      }
      st.paso='ubicacion_final_mantenimiento'; estado[from]=st;
      await enviarTexto(from, `Gracias.\n\nPara brindarle el total exacto, ¿me comparte su ubicación por WhatsApp?\nAdjuntar > Ubicación > Enviar ubicación actual.`);
      return res.sendStatus(200);
    }
    if(st.paso==='datos_fiscales_mantenimiento_ruc'){
      st.rucCedula = textoRaw.trim().toUpperCase(); st.paso='ubicacion_final_mantenimiento'; estado[from]=st;
      await enviarTexto(from, `Gracias.\n\nPara brindarle el total exacto, ¿me comparte su ubicación por WhatsApp?\nAdjuntar > Ubicación > Enviar ubicación actual.`);
      return res.sendStatus(200);
    }
    if(st.paso==='detalle_servicio'){
      st.detalle = ia?.detalleServicio || textoRaw;
      if(ia?.cantidad) st.cantidad = ia.cantidad; else { const n = textoRaw.match(/\d+/); if(n) st.cantidad = parseInt(n[0]); }
      if(!st.cantidad){ st.paso='cantidad_servicio'; estado[from]=st; await enviarTexto(from, `Anotado: ${st.detalle}.\n\n¿Cuántas unidades o equipos requiere para este servicio?`); return res.sendStatus(200); }
      st.paso='datos_fiscales_servicio'; estado[from]=st;
      await enviarTexto(from, `Anotado.\n\nPara dejarle su cotización formal, ¿me indica su nombre completo y su RUC o cédula, por favor? Puede mandarlos juntos.`);
      return res.sendStatus(200);
    }
    if(st.paso==='cantidad_servicio'){ const n = parseInt(texto) || ia?.cantidad || 1; st.cantidad = n; st.paso='datos_fiscales_servicio'; estado[from]=st; await enviarTexto(from, `Perfecto. Cantidad: ${n}.\n\nPara dejarle su cotización formal, ¿me indica su nombre completo y su RUC o cédula, por favor? Puede mandarlos juntos.`); return res.sendStatus(200); }
    if(st.paso==='datos_fiscales_servicio'){
      const parsed = parseNombreRuc(textoRaw);
      st.nombreCompleto = parsed.nombre || ia?.nombreCompleto || st.nombre; st.rucCedula = parsed.ruc || ia?.rucCedula || textoRaw;
      if(!parsed.ruc && !ia?.rucCedula && !/\d/.test(textoRaw)){ st.paso='datos_fiscales_servicio_ruc'; estado[from]=st; await enviarTexto(from, `Gracias. ¿Me indica su RUC o cédula, por favor?`); return res.sendStatus(200); }
      st.paso='ubicacion_final_servicio'; estado[from]=st;
      await enviarTexto(from, `Gracias.\n\nPara brindarle el total exacto, ¿me comparte su ubicación por WhatsApp?\nAdjuntar > Ubicación > Enviar ubicación actual.`);
      return res.sendStatus(200);
    }
    if(st.paso==='datos_fiscales_servicio_ruc'){ st.rucCedula = textoRaw.trim().toUpperCase(); st.paso='ubicacion_final_servicio'; estado[from]=st; await enviarTexto(from, `Gracias.\n\nPara brindarle el total exacto, ¿me comparte su ubicación por WhatsApp?\nAdjuntar > Ubicación > Enviar ubicación actual.`); return res.sendStatus(200); }
    if(st.paso==='ubicacion_final_servicio'){
      const leadServ2 = `LEAD SERVICIO - ANCA\n\nCLIENTE: ${st.nombreCompleto || st.nombre}\nCED / RUC: ${st.rucCedula}\nSERVICIO: ${st.servicio}\nDETALLE: ${st.detalle}\nCANTIDAD: ${st.cantidad || 1}\nUBICACION: ${st.ubicacionTexto}`;
      console.log(leadServ2); await enviarLeadDueno(leadServ2, from);
      await enviarTexto(from, `Su solicitud quedó registrada.\n\nResumen:\nA nombre de: ${st.nombreCompleto || st.nombre}\nRUC / Cédula: ${st.rucCedula}\nServicio: ${st.servicio}\nDetalle: ${st.detalle}\nCantidad: ${st.cantidad || 1}\nUbicación: ${st.ubicacionTexto}\n\nUn asesor de ANCA le contactará para confirmarle el costo total y enviarle su cotización en PDF.\n\nGracias por elegir ANCA Marketplace.`);
      estado[from]={paso:'inicio'}; return res.sendStatus(200);
    }
    if(st.paso==='datos_fiscales'){
      const parsed = parseNombreRuc(textoRaw);
      st.nombreCompleto = parsed.nombre || ia?.nombreCompleto || textoRaw.split(',')[0] || textoRaw;
      st.rucCedula = parsed.ruc || ia?.rucCedula || textoRaw.split(',')[1]?.trim() || '';
      // v28: Si ya viene nombre + cedula juntos, NO volver a pedir
      if(parsed.ruc){
        const p = PRODUCTOS.find(x=>x.id===st.productoId); const cantidad = st.cantidad || 1; const costo = st.costoKm || 0;
        if(p){
          const unit = st.modo==='instalado' ? p.instalado : p.suministro;
          const total = unit * cantidad + (st.modo==='instalado' ? costo : (st.quiereEnvio==='si' ? costo : 0));
          st.totalFinal = total;
          await enviarTexto(from, `COTIZACIÓN - ANCA MARKETPLACE\n\nA nombre de: ${st.nombreCompleto}\nRUC / Cédula: ${st.rucCedula}\nUbicación: ${st.ubicacionTexto}\n\nEquipo: ${p.marca} ${p.tipo} ${p.btu} BTU\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\nCantidad: ${cantidad} unidad(es)\nPrecio unitario: ${fmt(unit)}\nTOTAL A PAGAR: ${fmt(total)}\n\nIncluye instalación, base, sellado y protector de voltaje de cortesía.\nGarantía: 18 meses en compresor, 1 año en partes.${textoCierre()}`);
          estado[from]={...st, paso:'cierre_venta'}; return res.sendStatus(200);
        }
        return res.sendStatus(200);
      }
      if(!st.rucCedula || st.rucCedula.length < 5){ st.paso='datos_fiscales_ruc'; estado[from]=st; await enviarTexto(from, `Gracias. ¿Me indica su RUC o cédula, por favor?`); return res.sendStatus(200); }
      const p = PRODUCTOS.find(x=>x.id===st.productoId); const cantidad = st.cantidad || 1; const costo = st.costoKm || 0;
      if(p){
        const unit = st.modo==='instalado' ? p.instalado : p.suministro;
        const total = unit * cantidad + (st.modo==='instalado' ? costo : (st.quiereEnvio==='si' ? costo : 0));
        st.totalFinal = total;
        await enviarTexto(from, `COTIZACIÓN - ANCA MARKETPLACE\n\nA nombre de: ${st.nombreCompleto}\nRUC / Cédula: ${st.rucCedula}\nUbicación: ${st.ubicacionTexto}\n\nEquipo: ${p.marca} ${p.tipo} ${p.btu} BTU\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\nCantidad: ${cantidad} unidad(es)\nPrecio unitario: ${fmt(unit)}\nTOTAL A PAGAR: ${fmt(total)}\n\nIncluye instalación, base, sellado y protector de voltaje de cortesía.\nGarantía: 18 meses en compresor, 1 año en partes.${textoCierre()}`);
        estado[from]={...st, paso:'cierre_venta'}; return res.sendStatus(200);
      }
      return res.sendStatus(200);
    }
    if(st.paso==='datos_fiscales_ruc'){
      st.rucCedula = textoRaw.trim().toUpperCase(); const p = PRODUCTOS.find(x=>x.id===st.productoId); const cantidad = st.cantidad || 1; const costo = st.costoKm || 0;
      if(p){
        const unit = st.modo==='instalado' ? p.instalado : p.suministro;
        const total = unit * cantidad + (st.modo==='instalado' ? costo : (st.quiereEnvio==='si' ? costo : 0));
        st.totalFinal = total;
        await enviarTexto(from, `COTIZACIÓN - ANCA MARKETPLACE\n\nA nombre de: ${st.nombreCompleto}\nRUC / Cédula: ${st.rucCedula}\nUbicación: ${st.ubicacionTexto}\n\nEquipo: ${p.marca} ${p.tipo} ${p.btu} BTU\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n\nCantidad: ${cantidad} unidad(es)\nPrecio unitario: ${fmt(unit)}\nTOTAL A PAGAR: ${fmt(total)}${textoCierre()}`);
        estado[from]={...st, paso:'cierre_venta'}; return res.sendStatus(200);
      }
      return res.sendStatus(200);
    }
    if(st.paso==='medidas'){
      let m2 = ia?.m2 || null;
      if(!m2){ const nums = textoRaw.replace(',','.').match(/(\d+(\.\d+)?)/g); if(nums && nums.length>=2) m2 = parseFloat(nums[0])*parseFloat(nums[1]); else if(nums && nums.length===1) m2 = parseFloat(nums[0]); }
      if(ia?.btuSolicitado){ st.btuRecomendado = ia.btuSolicitado; st.m2 = m2 || 0; }
      else if(m2){ st.m2 = m2; st.btuRecomendado = recomendarBtu(m2); }
      else { await enviarTexto(from, 'Disculpe, no logré identificar las medidas. ¿Me indica el largo por el ancho? Por ejemplo: 4 x 3, o la capacidad que busca, por ejemplo 12000 BTU.'); return res.sendStatus(200); }
      st.paso='voltaje'; estado[from]=st; if(ia?.voltaje) st.voltaje = ia.voltaje;
      await enviarTexto(from, `Para ${st.m2 ? st.m2+' m2' : 'su ambiente'} la capacidad recomendada es de ${st.btuRecomendado} BTU.\n\n${st.btuRecomendado>=18000 ? 'Le comento que a partir de 18,000 BTU, los equipos trabajan únicamente en 220V.\n\n' : ''}¿Con qué voltaje cuenta en su vivienda? ¿110V o 220V?`);
      return res.sendStatus(200);
    }
    if(st.paso==='voltaje'){
      const volt = ia?.voltaje || (texto.includes('220') ? '220V' : texto.includes('110') ? '110V' : null);
      if(!volt){ await enviarTexto(from, '¿Me confirma el voltaje? ¿110V o 220V?'); return res.sendStatus(200); }
      if(st.btuRecomendado >= 18000 && volt === '110V'){ await enviarTexto(from, `Le explico con transparencia: para ${st.btuRecomendado} BTU no existe equipo en 110V. Todos los equipos de 18,000 BTU en adelante son 220V.\n\n¿Desea que le cotice en 220V o prefiere 2 equipos de 12,000 BTU en 110V? Responda 220V o 2 EQUIPOS.`); st.paso='resolver_110'; estado[from]=st; return res.sendStatus(200); }
      st.voltaje = volt; st.paso='elegir_equipo'; estado[from]=st;
      // v28: SI ES INSTALADO, SOLO SPLIT / PISO-TECHO / CASSETTE
      let filtrados = PRODUCTOS.filter(p=>p.btu===st.btuRecomendado && p.voltaje===st.voltaje);
      if(st.modo==='instalado') filtrados = filtrados.filter(p=>p.instala===true);
      if(ia?.marcaSolicitada) filtrados = filtrados.filter(p=>p.marca===ia.marcaSolicitada);
      if(ia?.tipoSolicitado){
        // Si pide ventana/portatil con instalacion, avisar que no se instala
        if(st.modo==='instalado' && (ia.tipoSolicitado==='VENTANA' || ia.tipoSolicitado==='PORTATIL')){
          await enviarTexto(from, `Le aclaro: los equipos de ventana y portátil no requieren instalación, solo se vende el equipo. Se conecta y listo.\n\n¿Desea que le cotice solo el equipo de ventana / portátil, o prefiere un SPLIT con instalación? Responda: SOLO EQUIPO o SPLIT.`);
          st.paso='aclarar_ventana'; estado[from]=st; return res.sendStatus(200);
        }
        filtrados = filtrados.filter(p=>p.tipo===ia.tipoSolicitado);
      }
      if(filtrados.length===0) filtrados = PRODUCTOS.filter(p=>p.btu===st.btuRecomendado && (st.modo==='instalado' ? p.instala : true));
      st.listaActual = filtrados.map(p=>p.id); estado[from]=st;
      let textoLista = `Estas son las opciones disponibles en ${st.btuRecomendado} BTU en ${st.voltaje} ${st.modo==='instalado' ? 'con instalación' : 'solo equipo'}:\n\n`;
      filtrados.forEach((p,i)=>{ const precio = st.modo==='instalado' ? p.instalado : p.suministro; textoLista += `${i+1}. ${p.marca} ${p.tipo} ${p.btu} BTU - Modelo ${p.modelo}\n   Voltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\n   Precio: ${fmt(precio)}\n\n`; });
      textoLista += 'Por favor, responda con el número del equipo que le interesa. Ejemplo: 1';
      await enviarTexto(from, textoLista); return res.sendStatus(200);
    }
    if(st.paso==='aclarar_ventana'){
      if(texto.includes('solo') || texto.includes('ventana') || texto.includes('portatil') || texto.includes('portátil')){ st.modo='suministro'; st.servicio='solo_equipo'; st.paso='voltaje'; estado[from]=st; await enviarTexto(from, 'Perfecto, le cotizo solo el equipo, sin instalación. ¿Me confirma el voltaje? ¿110V o 220V?'); return res.sendStatus(200); }
      if(texto.includes('split')){ st.paso='voltaje'; estado[from]=st; await enviarTexto(from, 'Perfecto, le cotizo SPLIT con instalación. ¿Me confirma el voltaje? ¿110V o 220V?'); return res.sendStatus(200); }
      await enviarTexto(from, 'Responda: SOLO EQUIPO o SPLIT.'); return res.sendStatus(200);
    }
    if(st.paso==='resolver_110'){
      if(texto.includes('220')){ st.voltaje='220V'; st.paso='voltaje'; estado[from]=st; await enviarTexto(from, 'Perfecto, le cotizo en 220V. ¿Me confirma? Responda 220V.'); return res.sendStatus(200); }
      if(texto.includes('2') || texto.includes('dos')){ st.btuRecomendado=12000; st.voltaje='110V'; st.paso='elegir_equipo'; estado[from]=st; await enviarTexto(from, 'Entendido. Le cotizo 2 equipos de 12,000 BTU en 110V.'); return res.sendStatus(200); }
      await enviarTexto(from, 'Responda 220V o 2 EQUIPOS.'); return res.sendStatus(200);
    }
    if(st.paso==='elegir_equipo'){
      const num = parseInt(texto); const lista = st.listaActual || [];
      if(num>=1 && num<=lista.length){
        const p = PRODUCTOS.find(x=>x.id===lista[num-1]); st.productoId = p.id; st.paso='cantidad_equipo'; estado[from]=st;
        await enviarTexto(from, `Excelente elección.\n\n${p.marca} ${p.tipo} ${p.btu} BTU\nModelo: ${p.modelo}\nVoltaje: ${p.voltaje} | ${p.inverter} | ${p.seer}\nPrecio unitario: ${fmt(st.modo==='instalado' ? p.instalado : p.suministro)}\n\n¿Cuántas unidades requiere?`); return res.sendStatus(200);
      }
      await enviarTexto(from, `Por favor, responda con el número del equipo, del 1 al ${lista.length}.`); return res.sendStatus(200);
    }
    if(st.paso==='cantidad_equipo'){
      const cant = parseInt(texto) || ia?.cantidad || 1; if(cant < 1 || cant > 50){ await enviarTexto(from, '¿Cuántas unidades requiere? Por favor, indíqueme un número entre 1 y 50.'); return res.sendStatus(200); }
      st.cantidad = cant; estado[from]=st; const p = PRODUCTOS.find(x=>x.id===st.productoId);
      if(st.modo==='instalado'){ st.paso='ubicacion_final'; estado[from]=st; await enviarTexto(from, `Perfecto. Cantidad: ${cant} unidad(es).\n\nPrecio unitario con instalación: ${fmt(p.instalado)}\nSubtotal: ${fmt(p.instalado * cant)}\n\nPara brindarle el total exacto, ¿me comparte su ubicación por WhatsApp?\nAdjuntar > Ubicación > Enviar ubicación actual.`); }
      else { st.paso='envio_equipo'; estado[from]=st; await enviarTexto(from, `Perfecto. Cantidad: ${cant} unidad(es).\n\nPrecio unitario solo equipo: ${fmt(p.suministro)}\nSubtotal: ${fmt(p.suministro * cant)}\n\n¿Desea envío a domicilio o retiro en tienda?\n\nResponda: ENVIO o RETIRO.`); }
      return res.sendStatus(200);
    }
    if(st.paso==='envio_equipo'){
      if(texto.includes('retiro')){ st.quiereEnvio='no'; st.costoKm=0; st.distKm=0; st.paso='datos_fiscales'; estado[from]=st; await enviarTexto(from, `Perfecto. Retiro en tienda.\n\nPara dejarle su cotización formal, ¿me indica su nombre completo y su RUC o cédula, por favor? Puede mandarlos juntos.`); return res.sendStatus(200); }
      if(texto.includes('envio') || texto.includes('envío') || texto.includes('domicilio')){ st.quiereEnvio='si'; st.paso='ubicacion_final'; estado[from]=st; await enviarTexto(from, `Perfecto. Envío a domicilio.\n\nPara calcularle el total exacto, ¿me comparte su ubicación por WhatsApp?\nAdjuntar > Ubicación > Enviar ubicación actual.`); return res.sendStatus(200); }
      await enviarTexto(from, '¿Desea envío a domicilio o retiro en tienda? Responda: ENVIO o RETIRO.'); return res.sendStatus(200);
    }
    if(!st.nombre){ estado[from]={paso:'nombre'}; await enviarTexto(from, 'Hola, soy Anca, asistente virtual de ANCA Marketplace. ¿Con quién tengo el gusto?'); }
    else await enviarTexto(from, `Disculpe, no logré entenderle. ¿Me puede repetir su respuesta?`);
    return res.sendStatus(200);
  } catch(e){ console.log('ERROR', e); return res.sendStatus(200); }
});

app.get('/', (req,res)=>res.send('Bot ANCA v28 activo'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('ANCA v28 corriendo en puerto '+PORT));
