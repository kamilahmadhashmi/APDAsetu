/* ==========================================================================
   AEGIS-MESH / EMERGE - i18n MULTI-LANGUAGE TRANSLATION ENGINE
   Languages Supported: English (en), Hindi (hi), Odia (or)
   ========================================================================== */

export const translations = {
  en: {
    brand_name: 'EMERGE',
    brand_tag: 'AEGIS-MESH',
    dispatch_center: 'Dispatch Center',
    sys_admin: 'System Administrator',
    active_session: 'Active Session',
    tab_dashboard: 'Dashboard & Map',
    tab_incidents: 'Incidents (GIS Map)',
    tab_vision: 'AI / YOLOv8 Vision',
    tab_mesh: 'BLE Mesh Comms',
    tab_solver: 'Logistics Solver',
    tab_arch: 'Architecture',
    sos_btn: 'EMERGENCY SOS',
    mesh_relay_active: 'Mesh Relay Active',
    active_incidents: 'Active Incidents',
    live_telemetry: '12 LIVE TELEMETRY',
    filter_all: 'All',
    filter_p1: 'P1 Critical',
    filter_p2: 'P2 Urgent',
    gis_layers: 'GIS Layers:',
    flood_layer: 'Flood Extent (SAR)',
    route_layer: 'Evacuation Corridor',
    recenter_map: 'Recenter Map',
    execute_ai_dispatch: 'Execute AI Dispatch',
    filter_view: 'Filter View',
    broadcast_sos: 'Broadcast SOS',
    support: 'Support',
    logs: 'Logs',

    // Vision Panel
    yolo_pipeline: 'YOLOv8 Computer Vision Pipeline',
    feed_drone: 'Aerial Drone Alpha (Sector B4)',
    feed_sat: 'Satellite Sentinel-2 SAR',
    feed_flir: 'FLIR Night Thermal IR',
    toggle_boxes: 'Toggle Bounding Boxes',
    run_inference: 'Re-Run Inference Pass',
    mask_opacity: 'Segmentation Mask Opacity',
    conf_thresh: 'YOLOv8 Confidence Threshold',

    // Mesh Panel
    mesh_title: 'Offline Peer Mesh Relay Protocol (BLE / Wi-Fi Direct)',
    blackout_active: 'CELLULAR BLACKOUT - MESH ACTIVE',
    toggle_blackout: 'Toggle Network Outage Mode',
    broadcast_ping: 'Broadcast Ping Hop',
    encrypted_packet: 'AES-256 Telemetry Packet',
    send_ack: 'Send Encrypted Mesh ACK Packet',

    // Solver Panel
    solver_title: 'Multi-Objective Solver Parameters',
    compute_solver: 'Compute Multi-Objective Allocation',
    delay_reduction: 'Response Delay Reduction',
    comparison_title: 'Response Latency & Hazard Risk Comparison',

    // Architecture Panel
    arch_title: 'AEGIS System Architecture & Data Flow Pipeline',
    layer_1: '1. FIELD & INGESTION LAYER',
    layer_2: '2. API GATEWAY & BACKEND LAYER',
    layer_3: '3. PROCESSING CORE & SPATIAL DATA LAYER',
    layer_4: '4. COMMAND & CONTROL TIER'
  },
  hi: {
    brand_name: 'इमर्ज',
    brand_tag: 'एजिस-मेश',
    dispatch_center: 'प्रेषण केंद्र',
    sys_admin: 'सिस्टम प्रशासक',
    active_session: 'सक्रिय सत्र',
    tab_dashboard: 'डैशबोर्ड और मानचित्र',
    tab_incidents: 'घटनाएं (जीआईएस)',
    tab_vision: 'एआई / दृष्टि इंजन',
    tab_mesh: 'बीएलई मेश रिले',
    tab_solver: 'प्रेषण समाधानकर्ता',
    tab_arch: 'सिस्टम वास्तुकला',
    sos_btn: 'आपातकालीन एसओएस',
    mesh_relay_active: 'मेश रिले सक्रिय',
    active_incidents: 'सक्रिय घटनाएं',
    live_telemetry: '12 लाइव टेलीमेट्री',
    filter_all: 'सभी',
    filter_p1: 'P1 गंभीर',
    filter_p2: 'P2 अतिआवश्यक',
    gis_layers: 'जीआईएस परतें:',
    flood_layer: 'बाढ़ सीमा (एसएआर)',
    route_layer: 'निकासी गलियारा',
    recenter_map: 'मानचित्र पुनरकेंद्रित करें',
    execute_ai_dispatch: 'एआई प्रेषण चलाएं',
    filter_view: 'दृश्य फ़िल्टर करें',
    broadcast_sos: 'एसओएस प्रसारित करें',
    support: 'सहायता',
    logs: 'लॉग',

    // Vision Panel
    yolo_pipeline: 'YOLOv8 कंप्यूटर विज़न पाइपलाइन',
    feed_drone: 'हवाई ड्रोन अल्फा (सेक्टर B4)',
    feed_sat: 'उपग्रह सेंटिनेल-2 एसएआर',
    feed_flir: 'एफएलआईआर नाइट थर्मल आईआर',
    toggle_boxes: 'बाउंडिंग बॉक्स टॉगल करें',
    run_inference: 'अनुमान पास पुनः चलाएं',
    mask_opacity: 'विखंडन मुखौटा अस्पष्टता',
    conf_thresh: 'YOLOv8 आत्मविश्वास सीमा',

    // Mesh Panel
    mesh_title: 'ऑफ़लाइन पीयर मेश रिले प्रोटोकॉल (बीएलई / वाई-फाई डायरेक्ट)',
    blackout_active: 'सेलुलर ब्लैकआउट - मेश सक्रिय',
    toggle_blackout: 'नेटवर्क आउटेज मोड टॉगल करें',
    broadcast_ping: 'पिंग हॉप प्रसारित करें',
    encrypted_packet: 'AES-256 टेलीमेट्री पैकेट',
    send_ack: 'एंक्रिप्टेड मेश ACK भेजें',

    // Solver Panel
    solver_title: 'बहु-उद्देश्यीय समाधानकर्ता पैरामीटर',
    compute_solver: 'बहु-उद्देश्य आवंटन की गणना करें',
    delay_reduction: 'प्रतिक्रिया विलंब में कमी',
    comparison_title: 'प्रतिक्रिया विलंबता और जोखिम तुलना',

    // Architecture Panel
    arch_title: 'एजिस सिस्टम वास्तुकला और डेटा प्रवाह',
    layer_1: '1. क्षेत्र और अंतर्ग्रहण परत',
    layer_2: '2. एपीआई गेटवे और बैकएंड परत',
    layer_3: '3. प्रसंस्करण कोर और स्थानिक परत',
    layer_4: '4. कमान और नियंत्रण स्तर'
  },
  or: {
    brand_name: 'ଇମର୍ଜ',
    brand_tag: 'ଏଜିସ-ମେସ',
    dispatch_center: 'ପ୍ରେରଣ କେନ୍ଦ୍ର',
    sys_admin: 'ସିଷ୍ଟମ ପ୍ରଶାସକ',
    active_session: 'ସକ୍ରିୟ ସେସନ',
    tab_dashboard: 'ଡ୍ୟାସବୋର୍ଡ ଏବଂ ମାନଚିତ୍ର',
    tab_incidents: 'ଘଟଣାବଳୀ (ଜିଆଇଏସ)',
    tab_vision: 'ଏଆଇ / ଦୃଷ୍ଟି ଇଞ୍ଜିନ',
    tab_mesh: 'ବିଏଲଇ ମେସ ରିଲେ',
    tab_solver: 'ପ୍ରେରଣ ସମାଧାନକାରୀ',
    tab_arch: 'ସିଷ୍ଟମ ସଂରଚନା',
    sos_btn: 'ଆପାତକାଳୀନ SOS',
    mesh_relay_active: 'ମେସ ରିଲେ ସକ୍ରିୟ',
    active_incidents: 'ସକ୍ରିୟ ଘଟଣାବଳୀ',
    live_telemetry: '12 ଲାଇଭ ଟେଲିମେଟ୍ରି',
    filter_all: 'ସମସ୍ତ',
    filter_p1: 'P1 ଗୁରୁତର',
    filter_p2: 'P2 ଆବଶ୍ୟକୀୟ',
    gis_layers: 'ଜିଆଇଏସ ସ୍ତର:',
    flood_layer: 'ବନ୍ୟା ସୀମା (SAR)',
    route_layer: 'ସ୍ଥାନାନ୍ତର ଗଳିପଥ',
    recenter_map: 'ମାନଚିତ୍ର ପୁନଃକେନ୍ଦ୍ରିତ କରନ୍ତୁ',
    execute_ai_dispatch: 'ଏଆଇ ପ୍ରେରଣ କାର୍ଯ୍ୟକାରୀ କରନ୍ତୁ',
    filter_view: 'ଫିଲ୍ଟର ଦୃଶ୍ୟ',
    broadcast_sos: 'SOS ପ୍ରସାରଣ କରନ୍ତୁ',
    support: 'ସହାୟତା',
    logs: 'ଲଗ',

    // Vision Panel
    yolo_pipeline: 'YOLOv8 କମ୍ପ୍ୟୁଟର ଭିଜନ ପାଇପଲାଇନ',
    feed_drone: 'ଆକାଶମାର୍ଗ ଡ୍ରୋନ ଆଲଫା (ସେକ୍ଟର B4)',
    feed_sat: 'ଉପଗ୍ରହ ସେଣ୍ଟିନେଲ-2 SAR',
    feed_flir: 'FLIR ନାଇଟ ଥର୍ମାଲ IR',
    toggle_boxes: 'ବାଉଣ୍ଡିଂ ବାକ୍ସ ଟୋଗଲ କରନ୍ତୁ',
    run_inference: 'ଅନୁମାନ ପାସ ପୁନଃ ଚଲାନ୍ତୁ',
    mask_opacity: 'ବିଭାଜନ ମାସ୍କ ସ୍ୱଚ୍ଛତା',
    conf_thresh: 'YOLOv8 ବିଶ୍ୱାସନୀୟତା ସୀମା',

    // Mesh Panel
    mesh_title: 'ଅଫଲାଇନ ପିଅର ମେସ ରିଲେ ପ୍ରୋଟୋକୋଲ (BLE / ୱାଇ-ଫାଇ ଡାଇରେକ୍ଟ)',
    blackout_active: 'ସେଲୁଲାର ବ୍ଲାକଆଉଟ - ମେସ ସକ୍ରିୟ',
    toggle_blackout: 'ନେଟୱାର୍କ ଆଉଟେଜ ମୋଡ ଟୋଗଲ କରନ୍ତୁ',
    broadcast_ping: 'ପିଙ୍ଗ ହପ ପ୍ରସାରଣ କରନ୍ତୁ',
    encrypted_packet: 'AES-256 ଟେଲିମେଟ୍ରି ପ୍ୟାକେଟ',
    send_ack: 'ଏନକ୍ରିପ୍ଟେଡ ମେସ ACK ପଠାନ୍ତୁ',

    // Solver Panel
    solver_title: 'ବହୁ-ଉଦ୍ଦେଶ୍ୟୀୟ ସମାଧାନକାରୀ ପାରାମିଟର',
    compute_solver: 'ବହୁ-ଉଦ୍ଦେଶ୍ୟ ଆବଣ୍ଟନ ଗଣନା କରନ୍ତୁ',
    delay_reduction: 'ପ୍ରତିକ୍ରିୟା ବିଳମ୍ବ ହ୍ରାସ',
    comparison_title: 'ପ୍ରତିକ୍ରିୟା ବିଳମ୍ବତା ଏବଂ ବିପଦ ତୁଳନା',

    // Architecture Panel
    arch_title: 'ଏଜିସ ସିଷ୍ଟମ ସଂରଚନା ଏବଂ ଡାଟା ପ୍ରବାହ',
    layer_1: '1. କ୍ଷେତ୍ର ଏବଂ ଅନ୍ତର୍ଗ୍ରହଣ ସ୍ତର',
    layer_2: '2. ଏପିଆଇ ଗେଟୱେ ଏବଂ ବ୍ୟାକଏଣ୍ଡ ସ୍ତର',
    layer_3: '3. ପ୍ରସେସିଂ କୋର ଏବଂ ସ୍ଥାନିକ ସ୍ତର',
    layer_4: '4. କମାଣ୍ଡ ଏବଂ କଣ୍ଟ୍ରୋଲ ସ୍ତର'
  }
};

let currentLang = localStorage.getItem('aegis_lang') || 'en';

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('aegis_lang', lang);
  }
}

export function t(key) {
  const dict = translations[currentLang] || translations.en;
  return dict[key] || translations.en[key] || key;
}
