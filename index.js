# ============================================================
# BOT ANCA - v15 - FORMATO LISTA TIPO LAFISE
# WhatsApp Cloud API Oficial - Meta
# Punto 0: Km 9 Carretera Nueva a Leon, Altos de Motastepe
# Kilometraje: 0-20 km = C$0 | +20 km = (km - 20) x C$16
# ============================================================
import math
import requests

# --- TUS DATOS DE META - CAMBIALOS ACA ---
WHATSAPP_TOKEN = "TU_TOKEN_DE_META_AQUI"
PHONE_NUMBER_ID = "TU_PHONE_NUMBER_ID_AQUI"
VERSION = "v21.0"

ANCA_LAT = 12.1340
ANCA_LON = -86.3590
KM_GRATIS = 20
PRECIO_POR_KM_EXTRA = 16
FACTOR_CARRETERA = 1.3

# --- BASE DE DATOS EXACTA DE TU EXCEL ---
PRODUCTOS = [
    {"id": "p1", "marca": "GPLUS", "tipo": "PORTATIL", "btu": 12000, "modelo": "GP-P12AO", "voltaje": "110V", "inverter": "No", "seer": "-", "suministro": 12825, "instalado": 12825},
    {"id": "p2", "marca": "GPLUS", "tipo": "VENTANA", "btu": 6000, "modelo": "GP-W061MS", "voltaje": "110V", "inverter": "No", "seer": "-", "suministro": 6210, "instalado": 6210},
    {"id": "p3", "marca": "GPLUS", "tipo": "VENTANA", "btu": 12000, "modelo": "GP-W121MC", "voltaje": "110V", "inverter": "No", "seer": "-", "suministro": 12825, "instalado": 12825},
    {"id": "p4", "marca": "GPLUS", "tipo": "SPLIT", "btu": 12000, "modelo": "GP-S121C", "voltaje": "110V", "inverter": "No", "seer": "SEER 13", "suministro": 11475, "instalado": 15275},
    {"id": "p5", "marca": "GPLUS", "tipo": "SPLIT", "btu": 12000, "modelo": "GP-S122C", "voltaje": "220V", "inverter": "No", "seer": "SEER 13", "suministro": 10395, "instalado": 14195},
    {"id": "p6", "marca": "GPLUS", "tipo": "SPLIT", "btu": 18000, "modelo": "GP-S182C", "voltaje": "220V", "inverter": "No", "seer": "SEER 14", "suministro": 18900, "instalado": 22700},
    {"id": "p7", "marca": "GPLUS", "tipo": "SPLIT", "btu": 24000, "modelo": "GP-S242C", "voltaje": "220V", "inverter": "No", "seer": "SEER 14", "suministro": 22950, "instalado": 28550},
    {"id": "p8", "marca": "GPLUS", "tipo": "SPLIT", "btu": 36000, "modelo": "GP-S362C", "voltaje": "220V", "inverter": "No", "seer": "SEER 14", "suministro": 35100, "instalado": 42600},
    {"id": "p9", "marca": "GPLUS", "tipo": "PISO-TECHO", "btu": 60000, "modelo": "GP-60PT", "voltaje": "220V", "inverter": "No", "seer": "SEER 13", "suministro": 67500, "instalado": 82300},
    {"id": "p10", "marca": "GPLUS", "tipo": "SPLIT", "btu": 12000, "modelo": "GP-S12000INV", "voltaje": "220V", "inverter": "Si - INVERTER", "seer": "SEER 18", "suministro": 13230, "instalado": 17030},
    {"id": "p11", "marca": "GPLUS", "tipo": "SPLIT", "btu": 18000, "modelo": "GP-S18000INV", "voltaje": "220V", "inverter": "Si - INVERTER", "seer": "SEER 18", "suministro": 21060, "instalado": 24860},
    {"id": "p12", "marca": "GPLUS", "tipo": "SPLIT", "btu": 24000, "modelo": "GP-S24000INV", "voltaje": "220V", "inverter": "Si - INVERTER", "seer": "SEER 18", "suministro": 25650, "instalado": 31250},
    {"id": "p13", "marca": "GPLUS", "tipo": "SPLIT", "btu": 36000, "modelo": "GP-S36000INV", "voltaje": "220V", "inverter": "Si - INVERTER", "seer": "SEER 18", "suministro": 41850, "instalado": 49350},
    {"id": "p14", "marca": "GPLUS", "tipo": "PISO-TECHO", "btu": 60000, "modelo": "GP-60PTINV", "voltaje": "220V", "inverter": "Si - INVERTER", "seer": "SEER 18", "suministro": 72900, "instalado": 87700},
    {"id": "p15", "marca": "GPLUS", "tipo": "CASSETTE", "btu": 60000, "modelo": "GP-60CTINV", "voltaje": "220V", "inverter": "Si - INVERTER", "seer": "SEER 17", "suministro": 88425, "instalado": 103225},
    {"id": "p16", "marca": "LG", "tipo": "SPLIT", "btu": 12000, "modelo": "VX121C1", "voltaje": "110V", "inverter": "Si - DUAL INVERTER", "seer": "SEER 18", "suministro": 18225, "instalado": 22025},
    {"id": "p17", "marca": "HISENSE", "tipo": "SPLIT", "btu": 12000, "modelo": "AC122CE", "voltaje": "220V", "inverter": "No - ESTANDAR", "seer": "SEER 14", "suministro": 10395, "instalado": 14195},
    {"id": "p18", "marca": "HISENSE", "tipo": "SPLIT", "btu": 12000, "modelo": "ATR121KA", "voltaje": "110V", "inverter": "Si - INVERTER", "seer": "SEER 18", "suministro": 14715, "instalado": 18515},
    {"id": "p19", "marca": "HISENSE", "tipo": "SPLIT", "btu": 12000, "modelo": "ATR122CJ", "voltaje": "220V", "inverter": "Si - INVERTER", "seer": "SEER 18", "suministro": 13230, "instalado": 17030},
    {"id": "p20", "marca": "HISENSE", "tipo": "SPLIT", "btu": 18000, "modelo": "ATR182CJ", "voltaje": "220V", "inverter": "Si - INVERTER", "seer": "SEER 18", "suministro": 21060, "instalado": 24860},
    {"id": "p21", "marca": "HISENSE", "tipo": "SPLIT", "btu": 24000, "modelo": "ATR242CJ", "voltaje": "220V", "inverter": "Si - INVERTER", "seer": "SEER 18", "suministro": 25650, "instalado": 31250},
]

# --- ENVIAR MENSAJE A WHATSAPP ---
def enviar(to, payload):
    url = f"https://graph.facebook.com/{VERSION}/{PHONE_NUMBER_ID}/messages"
    headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}", "Content-Type": "application/json"}
    data = {"messaging_product": "whatsapp", "to": to, **payload}
    return requests.post(url, headers=headers, json=data).json()

def enviar_texto(to, texto):
    return enviar(to, {"type": "text", "text": {"body": texto}})

def enviar_lista(to, body_text, button_text, sections):
    return enviar(to, {
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {"text": body_text},
            "action": {"button": button_text, "sections": sections}
        }
    })

def formato(n):
    return f"C${n:,.0f}".replace(",", ",")

# --- 1. MENU PRINCIPAL - COMO LAFISE ---
def menu_principal(to):
    enviar_lista(to,
        "¡Hola, soy tu asistente virtual de ANCA Marketplace! ❄️ Puedo ayudarte con cotizaciones 24/7.\n\nTe invito a seleccionar una opción 👇",
        "Menú de opciones ✅",
        [{
            "title": "ANCA Marketplace",
            "rows": [
                {"id": "menu_instalado", "title": "Suministro e Instalación ❄️", "description": "Equipo + instalado, con garantía"},
                {"id": "menu_solo_equipo", "title": "Solo equipo 📦", "description": "Solo suministro, sin instalación"},
                {"id": "menu_asesor", "title": "Hablar con asesor 👨‍💼", "description": "Te atiende una persona de ANCA"},
            ]
        }]
    )

# --- 2. MENU POR BTU - COMO LAFISE ---
def menu_btu(to, modo):
    # modo = 'instalado' o 'suministro'
    enviar_lista(to,
        f"Perfecto, elegiste {'Suministro e Instalación' if modo=='instalado' else 'Solo equipo'}.\n\n¿Qué capacidad necesita?",
        "Ver capacidades ✅",
        [{
            "title": "Capacidades disponibles",
            "rows": [
                {"id": f"btu_6000_{modo}", "title": "6,000 BTU", "description": "Para cuarto pequeño"},
                {"id": f"btu_12000_{modo}", "title": "12,000 BTU", "description": "Para cuarto / sala pequeña"},
                {"id": f"btu_18000_{modo}", "title": "18,000 BTU", "description": "Para sala mediana"},
                {"id": f"btu_24000_{modo}", "title": "24,000 BTU", "description": "Para sala grande"},
                {"id": f"btu_36000_{modo}", "title": "36,000 BTU", "description": "Para local / área grande"},
                {"id": f"btu_60000_{modo}", "title": "60,000 BTU", "description": "Piso-Techo / Cassette"},
            ]
        }]
    )

# --- 3. LISTA DE EQUIPOS POR BTU - CON VOLTAJE, SEER, INVERTER ---
def menu_equipos(to, btu, modo):
    filtrados = [p for p in PRODUCTOS if p["btu"] == btu]
    rows = []
    for p in filtrados:
        precio = p["instalado"] if modo == "instalado" else p["suministro"]
        rows.append({
            "id": f"prod_{p['id']}_{modo}",
            "title": f"{p['marca']} {p['tipo']} {p['btu']:,} BTU".replace(",", ","),
            "description": f"{p['modelo']} | {p['voltaje']} | {p['inverter']} | {p['seer']} | {formato(precio)}"
        })
    enviar_lista(to,
        f"Para *{btu:,} BTU* tenemos {'con instalación' if modo=='instalado' else 'solo equipo'}:\n\nTocá el equipo que te interesa 👇".replace(",", ","),
        "Ver equipos ✅",
        [{"title": f"Equipos {btu:,} BTU".replace(",", ","), "rows": rows}]
    )

# --- 4. KILOMETRAJE ---
def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def calcular_kilometraje(lat_c, lon_c):
    dist = round(haversine_km(ANCA_LAT, ANCA_LON, lat_c, lon_c) * FACTOR_CARRETERA, 1)
    if dist <= KM_GRATIS:
        return dist, 0
    return dist, round((dist - KM_GRATIS) * PRECIO_POR_KM_EXTRA)

def mensaje_pedir_ubicacion(to):
    enviar_texto(to,
        "*Importante sobre el kilometraje:*\n"
        "En ANCA, la instalación dentro de Managua y alrededores hasta 20 km desde nuestra tienda en "
        "Km 9 Carretera Nueva a León, Residencial Altos de Motastepe, es *sin costo de kilometraje*.\n\n"
        "Si su instalación es *fuera de Managua, a más de 20 km*, se agrega *C$16 por cada km extra*.\n"
        "Ejemplo: Si usted está a 40 km, son 20 km extra x C$16 = C$320.\n\n"
        "Para calcularle el costo exacto, ¿me manda su ubicación por WhatsApp? 📍\n"
        "Adjuntar > Ubicación > Enviar ubicación actual"
    )

def mensaje_detalle(to, producto, modo, km_costo=0, distancia=0):
    precio_base = producto["instalado"] if modo == "instalado" else producto["suministro"]
    total = precio_base + km_costo
    texto = (
        f"Perfecto, eligió:\n"
        f"*{producto['marca']} {producto['tipo']} {producto['btu']:,} BTU*\n"
        f"Modelo: {producto['modelo']}\n"
        f"Voltaje: {producto['voltaje']} | {producto['inverter']} | {producto['seer']}\n\n".replace(",", ",")
    )
    if modo == "instalado":
        texto += (
            "*Precio con instalación incluye:*\n"
            "• Servicio de instalación básica\n"
            "• Material de fijación\n"
            "• Sellado\n"
            "• Base de la unidad condensadora\n"
            "• Protector de voltaje de cortesía\n\n"
            "*Garantía:* 18 meses en compresor y 1 año en partes\n"
            "*Envío:* Hasta la puerta de su casa en Managua\n\n"
            f"Precio base: {formato(precio_base)}\n"
        )
        if km_costo > 0:
            texto += f"Distancia desde ANCA: {distancia} km\nKilometraje: ({distancia} - 20) x C$16 = {formato(km_costo)}\n"
        else:
            texto += "Kilometraje: C$0 (dentro de los 20 km gratis)\n"
        texto += f"*TOTAL A PAGAR: {formato(total)}*\n\n"
    else:
        texto += f"*Precio solo equipo incluye:*\n• Equipo completo nuevo en caja\n• Garantía: 18 meses compresor y 1 año partes\n• Envío hasta su casa en Managua\n\n*TOTAL: {formato(total)}*\n\n"
    texto += "¿Le apartamos este equipo? Escriba *SI* para apartarlo."
    enviar_texto(to, texto)

# --- FLUJO COMPLETO ---
# Cliente escribe HOLA -> menu_principal(to)
# Cliente toca "Suministro e Instalación" -> menu_btu(to, 'instalado')
# Cliente toca "12,000 BTU" -> menu_equipos(to, 12000, 'instalado')
# Cliente toca un equipo -> mensaje_pedir_ubicacion(to)
# Cliente manda ubicación -> calcular_kilometraje(lat, lon) -> mensaje_detalle(to, producto, 'instalado', costo, dist)
# Si es Solo equipo -> directo a mensaje_detalle sin pedir ubicación
