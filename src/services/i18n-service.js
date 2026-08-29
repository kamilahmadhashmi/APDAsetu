/* ==========================================================================
   RESQNET / AEGIS-MESH — CENTRALIZED GLOBAL MULTILINGUAL i18n SERVICE
   Shared reactive language state for Command Center & Smartphone Simulator.
   Supports English (en), Hindi (hi), Bengali (bn), and Odia (or).
   ========================================================================== */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', dir: 'ltr' }
];

export const translations = {
  en: {
    // Brand & Header
    brand_name: 'AapdaSetu',
    brand_tag: 'AapdaSetu',
    app_title: 'AapdaSetu',
    app_sub: 'Tactical Disaster Dispatch & Evacuation Mesh',
    dispatch_center: 'Dispatch Center',
    sys_admin: 'System Administrator',
    active_session: 'Active Session',
    mesh_relay_active: 'Mesh Relay Active',
    fastapi_latency: 'FastAPI Gateway',
    offline_demo_map: 'LOCAL OFFLINE ROUTING',
    sim_mode_badge: 'SIMULATION MODE • DEMO',
    demo_data_notice: 'Synthetic Hackathon Demo Data',

    // Navigation Tabs
    tab_map: 'GIS Map',
    tab_incidents: 'Incidents (GIS Map)',
    tab_dashboard: 'Safety Hub',
    tab_safety: 'Safety Status',
    tab_distress: 'Distress SOS',
    tab_vision: 'AI Camera / YOLOv8',
    tab_mesh: 'BLE Mesh Comms',
    tab_solver: 'Logistics Solver',
    tab_arch: 'System Architecture',
    tab_shelter: 'Safe Shelters',
    tab_routing: 'Evacuation',

    // Person & Field Device
    person_name: 'Arjun Sharma',
    person_device: 'FIELD-104',
    person_role: 'Citizen / Field Operator',
    person_blood: 'Blood Group: O+',
    person_medical_alert: 'Asthmatic (Carrying Inhaler)',
    status_at_risk: 'AT RISK (Flood Basin)',
    status_safe: 'SAFE',
    status_evacuating: 'EVACUATING • ACTIVE ROUTE',
    status_assisted: 'RESCUE ASSISTED',
    status_critical: 'CRITICAL',
    status_low_risk: 'LOW RISK',
    status_medium_risk: 'MEDIUM RISK',
    status_high_risk: 'HIGH RISK',

    // Map Overlays & Markers
    you_marker: 'YOU (ARJUN SHARMA)',
    safehouse_marker: 'SAFEHOUSE (Central Community Shelter)',
    rescue_marker: 'RESCUE TEAM (Alpha Boat Squad)',
    safe_road: 'Safe High-Ground Corridor',
    unsafe_road: 'Submerged / Blocked Hazard',
    flood_basin: 'Daya River Inundation Basin',
    center_on_me: 'Center on Me',
    my_location: 'My Position',
    recenter_map: 'Recenter Map',
    toggle_legend: 'Map Legend',
    legend_title: 'TACTICAL MAP LEGEND',
    legend_you: 'You (Arjun Sharma)',
    legend_safe_road: 'Safe Passable Corridor',
    legend_unsafe_road: 'Submerged / Blocked Road',
    legend_safehouse: 'Safe Disaster Shelter',
    legend_rescue: 'Rescue Squad / Boat',
    legend_flood: 'Flood Hazard Inundation',
    confidence_accuracy: 'Confidence',

    // Evacuation Routing
    safest_route: 'SAFEST ROUTE',
    fastest_route: 'FASTEST ROUTE',
    start_evacuation: 'START EVACUATION',
    pause_evacuation: 'PAUSE',
    resume_evacuation: 'RESUME',
    evacuation_active: 'EVACUATION ACTIVE',
    evacuation_paused: 'EVACUATION PAUSED',
    next_turn: 'NEXT TURN',
    step_counter: 'STEP {current} OF {total}',
    remaining_distance: 'Remaining',
    elevation_safe: 'Elevation: 46m (Safe Ridge)',
    arrived_safehouse: 'ARRIVED SAFELY AT CENTRAL COMMUNITY SHELTER!',
    recalc_toast_title: 'ROUTE UPDATED',
    recalc_toast_reason: 'Road R12 Flooded (Depth: 0.95m). Recalculated safest high-ground corridor.',
    sim_flood_btn: 'SIM FLOOD R12',
    recede_flood_btn: 'RECEDE R12',

    // Safehouse & Shelters
    safehouse_name: 'Central Community Shelter',
    safehouse_capacity: 'Capacity: {occupied} / {total} ({available} Available)',
    safehouse_elevation: 'Elevation: 45m (Above 100-yr Flood Basin)',
    safehouse_medical: 'Medical Aid: AVAILABLE',
    safehouse_supplies: 'Supplies: ADEQUATE (72h Reserve)',
    safehouse_power: 'Power: Solar + 120kVA Diesel Generator',
    safehouse_comms: 'Comms: VHF Ch 16 / SatLink',
    safehouse_navigate: 'NAVIGATE TO SAFEHOUSE',

    // Rescue Teams
    rescue_team_alpha: 'Rescue Team Alpha (NDRF Boat Squad)',
    rescue_spec: 'FLOOD & WATER EXTRACTION',
    rescue_equipment: '40HP Zodiac Rigid-Inflatable Boat + Thermal Scanner',
    rescue_leader: 'Capt. R. Deshmukh (4 Crew)',
    rescue_distance: '0.7 km away (ETA: 4 min)',
    request_rescue_btn: 'REQUEST RESCUE ASSISTANCE',
    request_sent: 'REQUEST SENT — TEAM ALPHA DISPATCHED',
    team_available: 'AVAILABLE',
    team_deployed: 'DEPLOYED',

    // Distress Signal Transmission Chain
    sos_button: 'EMERGENCY SOS',
    distress_title: 'ENCRYPTED DISTRESS SIGNAL',
    distress_protocol: 'AES-256 GCM • BLE Mesh Protocol',
    distress_step1_title: '1. DISTRESS QUEUED LOCALLY',
    distress_step1_desc: 'Packet signed & stored in local offline queue',
    distress_step2_title: '2. BLE MESH RELAY FOUND',
    distress_step2_desc: 'Forwarded via Peer Node 0x4F2A (Hop 1)',
    distress_step3_title: '3. LORA / SATELLITE GATEWAY',
    distress_step3_desc: 'Uplink established via High-Ground Relay Hub',
    distress_step4_title: '4. COMMAND CENTER RECEIVED',
    distress_step4_desc: 'Rescue dispatch ACK confirmed by Operations',
    transmit_distress_btn: 'TRANSMIT DISTRESS PACKET',
    broadcast_in_progress: 'BROADCASTING ACROSS MESH...',
    rescue_confirmed: 'RESCUE DISPATCH CONFIRMED',

    // Real-Time Flood Engine (Command Center)
    flood_engine_title: 'Real-Time Rising Flood Engine',
    surge_active_badge: 'RISING SURGE ACTIVE',
    live_water_depth: 'Live Water Depth',
    surge_velocity: 'Surge Velocity',
    forecast_12h_peak: '12h Forecast Peak',
    simulate_surge_btn: 'SIMULATE LIVE RISING FLOOD SURGE',
    surging_progress: 'RISING SURGE SIMULATION IN PROGRESS...',
    critical_breach_title: 'CRITICAL FLOOD BREACH ALERT',

    // BLE Mesh Network (Command Center)
    mesh_title: 'Offline Peer Mesh Relay Protocol (BLE / Wi-Fi Direct)',
    blackout_active: 'CELLULAR BLACKOUT - MESH ACTIVE',
    cellular_online: 'CELLULAR ONLINE',
    toggle_blackout: 'Toggle Network Blackout',
    broadcast_ping: 'Broadcast Ping Hop',
    encrypted_packet: 'AES-256 Encrypted Packet',
    send_ack: 'Send Encrypted Mesh ACK',
    gps_satellite_active: 'GPS SATELLITE: ACTIVE (3D Fix)',
    cellular_offline: 'CELLULAR: OFFLINE (BLE Mesh Mode)',

    // Logistics Solver (Command Center)
    solver_title: 'Multi-Objective Dispatch Solver Parameters',
    compute_solver: 'Compute Multi-Objective Allocation',
    delay_reduction: 'Response Delay Reduction',
    solver_comparison: 'Response Latency & Hazard Risk Comparison',

    // AI Vision
    yolo_pipeline: 'YOLOv8 Computer Vision Pipeline',
    feed_drone: 'Aerial Drone Alpha (Sector B4)',
    feed_sat: 'Satellite Sentinel-2 SAR',
    feed_flir: 'FLIR Night Thermal IR',
    run_inference: 'Re-Run Inference Pass',
    scan_button: 'Start AI Camera Scan',

    // Common Controls
    close: 'Close',
    dismiss: 'Dismiss',
    navigate: 'Navigate',
    details: 'Details',
    all: 'All',
    filter: 'Filter',
    search: 'Search incidents...',
    loading: 'Loading...'
  },

  hi: {
    // Brand & Header
    brand_name: 'आपदासेतु',
    brand_tag: 'AapdaSetu',
    app_title: 'आपदासेतु',
    app_sub: 'सामरिक आपदा प्रेषण और निकासी मेश',
    dispatch_center: 'आपदा प्रेषण केंद्र',
    sys_admin: 'सिस्टम प्रशासक',
    active_session: 'सक्रिय सत्र',
    mesh_relay_active: 'मेश रिले सक्रिय',
    fastapi_latency: 'फास्टएपीआई गेटवे',
    offline_demo_map: 'स्थानीय ऑफ़लाइन रूटिंग',
    sim_mode_badge: 'सिमुलेशन मोड • डेमो',
    demo_data_notice: 'सिंथेटिक हैकाथॉन डेमो डेटा',

    // Navigation Tabs
    tab_map: 'जीआईएस मानचित्र',
    tab_incidents: 'घटनाएं (जीआईएस)',
    tab_dashboard: 'सुरक्षा हब',
    tab_safety: 'सुरक्षा स्थिति',
    tab_distress: 'संकट एसओएस',
    tab_vision: 'एआई कैमरा / विज़न',
    tab_mesh: 'बीएलई मेश संचार',
    tab_solver: 'लॉजिस्टिक्स सॉल्वर',
    tab_arch: 'सिस्टम आर्किटेक्चर',
    tab_shelter: 'सुरक्षित आश्रय',
    tab_routing: 'निकासी मार्ग',

    // Person & Field Device
    person_name: 'अर्जुन शर्मा',
    person_device: 'फील्ड-104',
    person_role: 'नागरिक / फील्ड ऑपरेटर',
    person_blood: 'रक्त समूह: O+',
    person_medical_alert: 'अस्थमा पीड़ित (इनहेलर साथ में)',
    status_at_risk: 'जोखिम में (बाढ़ क्षेत्र)',
    status_safe: 'सुरक्षित',
    status_evacuating: 'निकासी जारी • सक्रिय मार्ग',
    status_assisted: 'बचाव सहायता प्राप्त',
    status_critical: 'अति गंभीर',
    status_low_risk: 'कम जोखिम',
    status_medium_risk: 'मध्यम जोखिम',
    status_high_risk: 'उच्च जोखिम',

    // Map Overlays & Markers
    you_marker: 'आप (अर्जुन शर्मा)',
    safehouse_marker: 'सुरक्षित आश्रय (केंद्रीय सामुदायिक केंद्र)',
    rescue_marker: 'बचाव दल (अल्फा बोट स्क्वाड)',
    safe_road: 'सुरक्षित उच्च-भूमि गलियारा',
    unsafe_road: 'जलमग्न / अवरुद्ध मार्ग',
    flood_basin: 'दया नदी बाढ़ बेसिन',
    center_on_me: 'मेरे स्थान पर केंद्रित करें',
    my_location: 'मेरी स्थिति',
    recenter_map: 'मानचित्र पुनरकेंद्रित करें',
    toggle_legend: 'मानचित्र संकेत',
    legend_title: 'सामरिक मानचित्र संकेत',
    legend_you: 'आप (अर्जुन शर्मा)',
    legend_safe_road: 'सुरक्षित पारगम्य गलियारा',
    legend_unsafe_road: 'जलमग्न / अवरुद्ध सड़क',
    legend_safehouse: 'सुरक्षित आपदा आश्रय',
    legend_rescue: 'बचाव दस्ता / नाव',
    legend_flood: 'बाढ़ जलभराव क्षेत्र',
    confidence_accuracy: 'सटीकता',

    // Evacuation Routing
    safest_route: 'सबसे सुरक्षित मार्ग',
    fastest_route: 'सबसे तेज़ मार्ग',
    start_evacuation: 'निकासी शुरू करें',
    pause_evacuation: 'रोकें',
    resume_evacuation: 'पुनः शुरू करें',
    evacuation_active: 'निकासी सक्रिय',
    evacuation_paused: 'निकासी रुकी हुई',
    next_turn: 'अगला मोड़',
    step_counter: 'चरण {current} / {total}',
    remaining_distance: 'शेष दूरी',
    elevation_safe: 'ऊंचाई: 46 मी (सुरक्षित कटक)',
    arrived_safehouse: 'केंद्रीय सामुदायिक आश्रय में सुरक्षित पहुंच गए!',
    recalc_toast_title: 'मार्ग अद्यतन हुआ',
    recalc_toast_reason: 'सड़क R12 जलमग्न (गहराई: 0.95 मी)। सुरक्षित उच्च-भूमि मार्ग पुनर्गणित।',
    sim_flood_btn: 'R12 बाढ़ सिमुलेट करें',
    recede_flood_btn: 'R12 जल कम करें',

    // Safehouse & Shelters
    safehouse_name: 'केंद्रीय सामुदायिक आश्रय',
    safehouse_capacity: 'क्षमता: {occupied} / {total} ({available} उपलब्ध)',
    safehouse_elevation: 'ऊंचाई: 45 मी (बाढ़ स्तर से ऊपर)',
    safehouse_medical: 'चिकित्सा सहायता: उपलब्ध',
    safehouse_supplies: 'राशन/पानी: पर्याप्त (72 घंटे का भंडार)',
    safehouse_power: 'बिजली: सौर + 120kVA जनरेटर',
    safehouse_comms: 'संचार: VHF चैनल 16 / सैटेलाइट',
    safehouse_navigate: 'आश्रय स्थल का मार्ग',

    // Rescue Teams
    rescue_team_alpha: 'बचाव दल अल्फा (एनडीआरएफ बोट स्क्वाड)',
    rescue_spec: 'बाढ़ एवं जल बचाव अभियान',
    rescue_equipment: '40HP जोडियाक नाव + थर्मल स्कैनर',
    rescue_leader: 'कैप्टन आर. देशमुख (4 सदस्य)',
    rescue_distance: '0.7 किमी दूर (पहुंच समय: 4 मिनट)',
    request_rescue_btn: 'बचाव सहायता का अनुरोध करें',
    request_sent: 'अनुरोध भेजा गया — टीम अल्फा रवाना',
    team_available: 'उपलब्ध',
    team_deployed: 'तैनात',

    // Distress Signal Transmission Chain
    sos_button: 'आपातकालीन एसओएस',
    distress_title: 'एन्क्रिप्टेड संकट संकेत',
    distress_protocol: 'AES-256 GCM • बीएलई मेश प्रोटोकॉल',
    distress_step1_title: '1. संकट संदेश स्थानीय कतार में',
    distress_step1_desc: 'पैकेट डिजिटल रूप से हस्ताक्षरित व सहेजा गया',
    distress_step2_title: '2. बीएलई मेश रिले मिला',
    distress_step2_desc: 'पीयर नोड 0x4F2A (हॉप 1) द्वारा आगे भेजा गया',
    distress_step3_title: '3. लोरा / सैटेलाइट गेटवे लिंक',
    distress_step3_desc: 'उच्च-भूमि रिले हब द्वारा अपलिंक स्थापित',
    distress_step4_title: '4. कमांड सेंटर को प्राप्त',
    distress_step4_desc: 'बचाव प्रेषण पावती की पुष्टि हुई',
    transmit_distress_btn: 'संकट पैकेट प्रसारित करें',
    broadcast_in_progress: 'मेश नेटवर्क में प्रसारण जारी...',
    rescue_confirmed: 'बचाव प्रेषण स्वीकृत',

    // Real-Time Flood Engine (Command Center)
    flood_engine_title: 'रीयल-टाइम बढ़ती बाढ़ इंजन',
    surge_active_badge: 'बाढ़ वृद्धि सक्रिय',
    live_water_depth: 'लाइव जल स्तर',
    surge_velocity: 'जल वृद्धि वेग',
    forecast_12h_peak: '12 घंटे का अनुमानित शिखर',
    simulate_surge_btn: 'लाइव बढ़ती बाढ़ का सिमुलेशन करें',
    surging_progress: 'बाढ़ सिमुलेशन प्रगति पर है...',
    critical_breach_title: 'गंभीर बाढ़ चेतावनी',

    // BLE Mesh Network (Command Center)
    mesh_title: 'ऑफ़लाइन पीयर मेश रिले प्रोटोकॉल (BLE / Wi-Fi Direct)',
    blackout_active: 'सेलुलर ब्लैकआउट - मेश सक्रिय',
    cellular_online: 'सेलुलर ऑनलाइन',
    toggle_blackout: 'नेटवर्क आउटेज टॉगल करें',
    broadcast_ping: 'ब्रॉडकास्ट पिंग हॉप',
    encrypted_packet: 'AES-256 एन्क्रिप्टेड पैकेट',
    send_ack: 'एन्क्रिप्टेड मेश ACK भेजें',
    gps_satellite_active: 'जीपीएस उपग्रह: सक्रिय (3D फिक्स)',
    cellular_offline: 'सेलुलर: ऑफ़लाइन (बीएलई मेश मोड)',

    // Logistics Solver (Command Center)
    solver_title: 'मल्टी-ऑब्जेक्टिव प्रेषण समाधान पैरामीटर',
    compute_solver: 'बहु-उद्देश्यीय आवंटन की गणना करें',
    delay_reduction: 'प्रतिक्रिया विलंब में कमी',
    solver_comparison: 'विलंबता एवं जोखिम तुलना',

    // AI Vision
    yolo_pipeline: 'YOLOv8 कंप्यूटर विज़न पाइपलाइन',
    feed_drone: 'हवाई ड्रोन अल्फा (सेक्टर B4)',
    feed_sat: 'उपग्रह सेंटिनेल-2 एसएआर',
    feed_flir: 'एफएलआईआर नाइट थर्मल आईआर',
    run_inference: 'पुनः इन्फरेंस चलाएं',
    scan_button: 'एआई कैमरा स्कैन शुरू करें',

    // Common Controls
    close: 'बंद करें',
    dismiss: 'खारिज करें',
    navigate: 'मार्ग देखें',
    details: 'विवरण',
    all: 'सभी',
    filter: 'फ़िल्टर',
    search: 'घटनाएं खोजें...',
    loading: 'लोड हो रहा है...'
  },

  bn: {
    // Brand & Header
    brand_name: 'আপদাসেতু',
    brand_tag: 'AapdaSetu',
    app_title: 'আপদাসেতু',
    app_sub: 'কৌশলগত দুর্যোগ প্রেরণ ও উচ্ছেদ মেশ',
    dispatch_center: 'দুর্যোগ প্রেরণ কেন্দ্র',
    sys_admin: 'সিস্টেম প্রশাসক',
    active_session: 'সক্রিয় সেশন',
    mesh_relay_active: 'মেশ রিলে সক্রিয়',
    fastapi_latency: 'ফাস্টএপিআই গেটওয়ে',
    offline_demo_map: 'স্থানীয় অফলাইন রাউটিং',
    sim_mode_badge: 'সিমুলেশন মোড • ডেমো',
    demo_data_notice: 'সিন্থেটিক হ্যাকাথন ডেমো ডেটা',

    // Navigation Tabs
    tab_map: 'জিআইএস মানচিত্র',
    tab_incidents: 'ঘটনাবলী (জিআইএস)',
    tab_dashboard: 'সুরক্ষা হাব',
    tab_safety: 'সুরক্ষা স্থিতি',
    tab_distress: 'জরুরি সংকেত SOS',
    tab_vision: 'এআই ক্যামেরা / ভিশন',
    tab_mesh: 'বিএলই মেশ সংযোগ',
    tab_solver: 'লজিস্টিক সমাধানকারী',
    tab_arch: 'সিস্টেম আর্কিটেকচার',
    tab_shelter: 'নিরাপদ আশ্রয়',
    tab_routing: 'উচ্ছেদ পথ',

    // Person & Field Device
    person_name: 'অর্জুন শর্মা',
    person_device: 'ফিল্ড-১০৪',
    person_role: 'নাগরিক / ফিল্ড অপারেটর',
    person_blood: 'রক্তের গ্রুপ: O+',
    person_medical_alert: 'হাঁপানির রোগী (ইনহেলার সাথে আছে)',
    status_at_risk: 'ঝুঁকিতে (বন্যা অববাহিকা)',
    status_safe: 'নিরাপদ',
    status_evacuating: 'উচ্ছেদ চলছে • সক্রিয় পথ',
    status_assisted: 'উদ্ধার সহায়তা প্রাপ্ত',
    status_critical: 'অত্যন্ত আশঙ্কাজনক',
    status_low_risk: 'কম ঝুঁকি',
    status_medium_risk: 'মাঝারি ঝুঁকি',
    status_high_risk: 'উচ্চ ঝুঁকি',

    // Map Overlays & Markers
    you_marker: 'আপনি (অর্জুন শর্মা)',
    safehouse_marker: 'নিরাপদ আশ্রয় (কেন্দ্রীয় কমিউনিটি শেল্টার)',
    rescue_marker: 'উদ্ধারকারী দল (আলফা বোট স্কোয়াড)',
    safe_road: 'নিরাপদ উচ্চভূমি করিডোর',
    unsafe_road: 'জলমগ্ন / অবরুদ্ধ বিপজ্জনক পথ',
    flood_basin: 'দয়া নদী প্লাবন অববাহিকা',
    center_on_me: 'আমার অবস্থানে কেন্দ্র করুন',
    my_location: 'আমার অবস্থান',
    recenter_map: 'মানচিত্র পুনরায় কেন্দ্র করুন',
    toggle_legend: 'মানচিত্র সূচক',
    legend_title: 'কৌশলগত মানচিত্র সূচক',
    legend_you: 'আপনি (অর্জুন শর্মা)',
    legend_safe_road: 'নিরাপদ চলাচলযোগ্য পথ',
    legend_unsafe_road: 'জলমগ্ন / অবরুদ্ধ রাস্তা',
    legend_safehouse: 'নিরাপদ দুর্যোগ আশ্রয়',
    legend_rescue: 'উদ্ধারকারী দল / নৌকা',
    legend_flood: 'বন্যা প্লাবন এলাকা',
    confidence_accuracy: 'নির্ভুলতা',

    // Evacuation Routing
    safest_route: 'সবচেয়ে নিরাপদ পথ',
    fastest_route: 'সবচেয়ে দ্রুত পথ',
    start_evacuation: 'উচ্ছেদ শুরু করুন',
    pause_evacuation: 'বিরতি',
    resume_evacuation: 'পুনরায় চালু',
    evacuation_active: 'উচ্ছেদ সক্রিয়',
    evacuation_paused: 'উচ্ছেদ স্থগিত',
    next_turn: 'পরবর্তী বাঁক',
    step_counter: 'ধাপ {current} / {total}',
    remaining_distance: 'অবশিষ্ট দূরত্ব',
    elevation_safe: 'উচ্চতা: ৪৬ মি (নিরাপদ উচ্চভূমি)',
    arrived_safehouse: 'কেন্দ্রীয় কমিউনিটি শেল্টারে নিরাপদে পৌঁছেছেন!',
    recalc_toast_title: 'পথ পুনর্নির্ধারিত হয়েছে',
    recalc_toast_reason: 'রাস্তা R12 জলমগ্ন (গভীরতা: ০.৯৫ মি)। নিরাপদ উচ্চভূমি করিডোর গণনা করা হয়েছে।',
    sim_flood_btn: 'R12 বন্যা সিমুলেট করুন',
    recede_flood_btn: 'R12 জল কমান',

    // Safehouse & Shelters
    safehouse_name: 'কেন্দ্রীয় কমিউনিটি শেল্টার',
    safehouse_capacity: 'ধারণক্ষমতা: {occupied} / {total} ({available} খালি)',
    safehouse_elevation: 'উচ্চতা: ৪৫ মি (বন্যার স্তর থেকে উঁচুতে)',
    safehouse_medical: 'চিকিৎসা সেবা: উপলব্ধ',
    safehouse_supplies: 'ত্রাণ সামগ্রী: পর্যাপ্ত (৭২ ঘণ্টার মজুদ)',
    safehouse_power: 'বিদ্যুৎ: সৌর + ১২০kVA জেনারেটর',
    safehouse_comms: 'যোগাযোগ: VHF চ্যানেল ১৬ / স্যাটেলাইট',
    safehouse_navigate: 'আশ্রয়ের পথে চলুন',

    // Rescue Teams
    rescue_team_alpha: 'উদ্ধারকারী দল আলফা (এনডিআরএফ বোট স্কোয়াড)',
    rescue_spec: 'বন্যা ও জল উদ্ধার অভিযান',
    rescue_equipment: '৪০HP জোডিয়াক নৌকা + থার্মাল স্ক্যানার',
    rescue_leader: 'ক্যাপ্টেন আর. দেশমুখ (৪ সদস্য)',
    rescue_distance: '০.৭ কিমি দূরে (পৌঁছানোর সময়: ৪ মিনিট)',
    request_rescue_btn: 'উদ্ধার সহায়তার অনুরোধ করুন',
    request_sent: 'অনুরোধ পাঠানো হয়েছে — দল আলফা রওনা হয়েছে',
    team_available: 'উপলব্ধ',
    team_deployed: 'মোতায়েন',

    // Distress Signal Transmission Chain
    sos_button: 'জরুরি এসওএস',
    distress_title: 'এনক্রিপ্ট করা বিপদ সংকেত',
    distress_protocol: 'AES-256 GCM • বিএলই মেশ প্রোটোকল',
    distress_step1_title: '১. বিপদবার্তা স্থানীয় সারিতে সংরক্ষিত',
    distress_step1_desc: 'প্যাকেট এনক্রিপ্ট ও অফলাইনে সংরক্ষিত',
    distress_step2_title: '২. বিএলই মেশ রিলে পাওয়া গেছে',
    distress_step2_desc: 'পিয়ার নোড 0x4F2A (হপ ১) এর মাধ্যমে ফরোয়ার্ড করা হয়েছে',
    distress_step3_title: '৩. লোরা / স্যাটেলাইট গেটওয়ে সংযোগ',
    distress_step3_desc: 'উচ্চভূমি রিলে হাব দ্বারা আপলিংক প্রতিষ্ঠিত',
    distress_step4_title: '৪. কমান্ড সেন্টারে গৃহীত',
    distress_step4_desc: 'উদ্ধার প্রেরণের স্বীকৃতি নিশ্চিত হয়েছে',
    transmit_distress_btn: 'বিপদ প্যাকেট সম্প্রচার করুন',
    broadcast_in_progress: 'মেশ নেটওয়ার্কে বার্তা পাঠানো হচ্ছে...',
    rescue_confirmed: 'উদ্ধার প্রেরণ নিশ্চিত',

    // Real-Time Flood Engine (Command Center)
    flood_engine_title: 'রিয়েল-টাইম বন্যা বৃদ্ধি ইঞ্জিন',
    surge_active_badge: 'বন্যা বৃদ্ধি সক্রিয়',
    live_water_depth: 'লাইভ জল স্তর',
    surge_velocity: 'জল বৃদ্ধির বেগ',
    forecast_12h_peak: '১২ ঘণ্টার সম্ভাব্য সর্বোচ্চ স্তর',
    simulate_surge_btn: 'বন্যা বৃদ্ধির সিমুলেশন চালু করুন',
    surging_progress: 'বন্যা সিমুলেশন চলছে...',
    critical_breach_title: 'মারাত্মক বন্যা সতর্কতা',

    // BLE Mesh Network (Command Center)
    mesh_title: 'অফলাইন পিয়ার মেশ রিলে প্রোটোকল (BLE / Wi-Fi Direct)',
    blackout_active: 'সেলুলার ব্ল্যাকআউট - মেশ সক্রিয়',
    cellular_online: 'সেলুলার অনলাইন',
    toggle_blackout: 'নেটওয়ার্ক বিভ্রাট পরিবর্তন করুন',
    broadcast_ping: 'ব্রডকাস্ট পিং হপ',
    encrypted_packet: 'AES-256 এনক্রিপ্ট করা প্যাকেট',
    send_ack: 'এনক্রিপ্ট করা মেশ ACK পাঠান',
    gps_satellite_active: 'জিপিএস স্যাটেলাইট: সক্রিয় (3D ফিক্স)',
    cellular_offline: 'সেলুলার: অফলাইন (বিএলই মেশ মোড)',

    // Logistics Solver (Command Center)
    solver_title: 'বহু-উদ্দেশ্যমূলক প্রেরণ সমাধান পরামিতি',
    compute_solver: 'বরাদ্দ গণনা করুন',
    delay_reduction: 'প্রতিক্রিয়া বিলম্ব হ্রাস',
    solver_comparison: 'বিলম্ব ও ঝুঁকি তুলনা',

    // AI Vision
    yolo_pipeline: 'YOLOv8 কম্পিউটার ভিশন পাইপলাইন',
    feed_drone: 'ড্রোন আলফা (সেক্টর B4)',
    feed_sat: 'স্যাটেলাইট সেন্টিনেল-২ এসএআর',
    feed_flir: 'এফএলআইআর নাইট থার্মাল আইআর',
    run_inference: 'পুনরায় বিশ্লেষণ করুন',
    scan_button: 'এআই স্ক্যান শুরু করুন',

    // Common Controls
    close: 'বন্ধ করুন',
    dismiss: 'বাতিল',
    navigate: 'পথ দেখুন',
    details: 'বিবরণ',
    all: 'সব',
    filter: 'ফিল্টার',
    search: 'অনুসন্ধান করুন...',
    loading: 'লোড হচ্ছে...'
  },

  or: {
    // Brand & Header
    brand_name: 'ଆପଦାସେତୁ',
    brand_tag: 'AapdaSetu',
    app_title: 'ଆପଦାସେତୁ',
    app_sub: 'ବିପର୍ଯ୍ୟୟ ପରିଚାଳନା ଓ ସ୍ଥାନାନ୍ତର ମେଶ୍',
    dispatch_center: 'ପ୍ରେରଣ କେନ୍ଦ୍ର',
    sys_admin: 'ସିଷ୍ଟମ୍ ଆଡମିନିଷ୍ଟ୍ରେଟର୍',
    active_session: 'ସକ୍ରିୟ ସେସନ୍',
    mesh_relay_active: 'ମେଶ୍ ରିଲେ ସକ୍ରିୟ',
    fastapi_latency: 'ଫାଷ୍ଟ-ଏପିଆଇ ଗେଟୱେ',
    offline_demo_map: 'ସ୍ଥାନୀୟ ଅଫଲାଇନ୍ ରାଉଟିଂ',
    sim_mode_badge: 'ସିମୁଲେସନ୍ ମୋଡ୍ • ଡେମୋ',
    demo_data_notice: 'ସିନ୍ଥେଟିକ୍ ଡେମୋ ଡାଟା',

    // Navigation Tabs
    tab_map: 'ଜିଆଇଏସ୍ ମ୍ୟାପ୍',
    tab_incidents: 'ଘଟଣାବଳୀ (ଜିଆଇଏସ୍)',
    tab_dashboard: 'ସୁରକ୍ଷା ହବ୍',
    tab_safety: 'ସୁରକ୍ଷା ସ୍ଥିତି',
    tab_distress: 'ଆପାତକାଳୀନ SOS',
    tab_vision: 'ଏଆଇ କ୍ୟାମେରା',
    tab_mesh: 'ବିଏଲ୍‌ଇ ମେଶ୍',
    tab_solver: 'ଲଜିଷ୍ଟିକ୍ସ ସଲଭର୍',
    tab_arch: 'ସିଷ୍ଟମ୍ ସଂରଚନା',
    tab_shelter: 'ସୁରକ୍ଷିତ ଆଶ୍ରୟସ୍ଥଳୀ',
    tab_routing: 'ସ୍ଥାନାନ୍ତରଣ',

    // Person & Field Device
    person_name: 'ଅର୍ଜୁନ ଶର୍ମା',
    person_device: 'ଫିଲ୍ଡ-୧୦୪',
    person_role: 'ନାଗରିକ / ଫିଲ୍ଡ ଅପରେଟର୍',
    person_blood: 'ରକ୍ତ ବର୍ଗ: O+',
    person_medical_alert: 'ଶ୍ୱାସରୋଗୀ (ଇନହେଲର୍ ସାଥିରେ ଅଛି)',
    status_at_risk: 'ବିପଦରେ (ବନ୍ୟା ପ୍ରଭାବିତ)',
    status_safe: 'ସୁରକ୍ଷିତ',
    status_evacuating: 'ସ୍ଥାନାନ୍ତର ଚାଲିଛି • ସକ୍ରିୟ ରାସ୍ତା',
    status_assisted: 'ଉଦ୍ଧାର ସହାୟତା ପ୍ରାପ୍ତ',
    status_critical: 'ଅତି ଗୁରୁତର',
    status_low_risk: 'କମ୍ ବିପଦ',
    status_medium_risk: 'ମଧ୍ୟମ ବିପଦ',
    status_high_risk: 'ଉଚ୍ଚ ବିପଦ',

    // Map Overlays & Markers
    you_marker: 'ଆପଣ (ଅର୍ଜୁନ ଶର୍ମା)',
    safehouse_marker: 'ସୁରକ୍ଷିତ ଆଶ୍ରୟ (କେନ୍ଦ୍ରୀୟ କମ୍ୟୁନିଟି ସେଣ୍ଟର୍)',
    rescue_marker: 'ଉଦ୍ଧାରକାରୀ ଦଳ (ଆଲଫା ବୋଟ୍ ସ୍କ୍ୱାଡ୍)',
    safe_road: 'ସୁରକ୍ଷିତ ଉଚ୍ଚ-ଭୂମି ରାସ୍ତା',
    unsafe_road: 'ଜଳମଗ୍ନ / ଅବରୋଧିତ ରାସ୍ତା',
    flood_basin: 'ଦୟା ନଦୀ ବନ୍ୟା ଅବବାହିକା',
    center_on_me: 'ମୋ ସ୍ଥାନକୁ କେନ୍ଦ୍ର କରନ୍ତୁ',
    my_location: 'ମୋର ସ୍ଥିତି',
    recenter_map: 'ମ୍ୟାପ୍ ପୁନଃକେନ୍ଦ୍ରିତ କରନ୍ତୁ',
    toggle_legend: 'ମ୍ୟାପ୍ ସୂଚକ',
    legend_title: 'ସାମରିକ ମ୍ୟାପ୍ ସୂଚକ',
    legend_you: 'ଆପଣ (ଅର୍ଜୁନ ଶର୍ମା)',
    legend_safe_road: 'ସୁରକ୍ଷିତ ରାସ୍ତା',
    legend_unsafe_road: 'ଜଳମଗ୍ନ ରାସ୍ତା',
    legend_safehouse: 'ବିପର୍ଯ୍ୟୟ ଆଶ୍ରୟସ୍ଥଳୀ',
    legend_rescue: 'ଉଦ୍ଧାରକାରୀ ଡଙ୍ଗା',
    legend_flood: 'ବନ୍ୟା ପ୍ଲାବିତ ଅଞ୍ଚଳ',
    confidence_accuracy: 'ସଠିକତା',

    // Evacuation Routing
    safest_route: 'ସବୁଠାରୁ ସୁରକ୍ଷିତ ରାସ୍ତା',
    fastest_route: 'ଦ୍ରୁତତମ ରାସ୍ତା',
    start_evacuation: 'ସ୍ଥାନାନ୍ତର ଆରମ୍ଭ କରନ୍ତୁ',
    pause_evacuation: 'ରଖନ୍ତୁ',
    resume_evacuation: 'ପୁନଃ ଆରମ୍ଭ',
    evacuation_active: 'ସ୍ଥାନାନ୍ତର ସକ୍ରିୟ',
    evacuation_paused: 'ସ୍ଥାନାନ୍ତର ସ୍ଥଗିତ',
    next_turn: 'ପରବର୍ତ୍ତୀ ମୋଡ଼',
    step_counter: 'ପଦକ୍ଷେପ {current} / {total}',
    remaining_distance: 'ବାକି ଥିବା ଦୂରତା',
    elevation_safe: 'ଉଚ୍ଚତା: ୪୬ ମିଟର (ସୁରକ୍ଷିତ)',
    arrived_safehouse: 'କେନ୍ଦ୍ରୀୟ ଆଶ୍ରୟସ୍ଥଳୀରେ ସୁରକ୍ଷିତ ପହଞ୍ଚିଗଲେ!',
    recalc_toast_title: 'ରାସ୍ତା ପରିବର୍ତ୍ତନ ହେଲା',
    recalc_toast_reason: 'R12 ରାସ୍ତା ଜଳମଗ୍ନ (୦.୯୫ ମିଟର)। ସୁରକ୍ଷିତ ଉଚ୍ଚଭୂମି ରାସ୍ତା ନିର୍ଦ୍ଧାରିତ ହେଲା।',
    sim_flood_btn: 'R12 ବନ୍ୟା ସିମୁଲେଟ୍',
    recede_flood_btn: 'R12 ଜଳ ହ୍ରାସ',

    // Safehouse & Shelters
    safehouse_name: 'କେନ୍ଦ୍ରୀୟ କମ୍ୟୁନିଟି ଆଶ୍ରୟ',
    safehouse_capacity: 'କ୍ଷମତା: {occupied} / {total} ({available} ଉପଲବ୍ଧ)',
    safehouse_elevation: 'ଉଚ୍ଚତା: ୪୫ ମିଟର (ବନ୍ୟା ସ୍ତରରୁ ଉପରେ)',
    safehouse_medical: 'ଡାକ୍ତରୀ ସେବା: ଉପଲବ୍ଧ',
    safehouse_supplies: 'ଖାଦ୍ୟ/ପାନୀୟ: ପର୍ଯ୍ୟାପ୍ତ (୭୨ ଘଣ୍ଟା)',
    safehouse_power: 'ବିଦ୍ୟୁତ୍: ସୌର + ୧୨୦kVA ଜେନେରେଟର୍',
    safehouse_comms: 'ଯୋଗାଯୋଗ: VHF ଚ୍ୟାନେଲ୍ ୧୬',
    safehouse_navigate: 'ଆଶ୍ରୟସ୍ଥଳୀକୁ ଯାଆନ୍ତୁ',

    // Rescue Teams
    rescue_team_alpha: 'ଉଦ୍ଧାରକାରୀ ଦଳ ଆଲଫା (NDRF ବୋଟ୍)',
    rescue_spec: 'ବନ୍ୟା ଜଳ ଉଦ୍ଧାର କାର୍ଯ୍ୟ',
    rescue_equipment: '୪୦HP ବୋଟ୍ + ଥର୍ମାଲ୍ ସ୍କାନର୍',
    rescue_leader: 'କ୍ୟାପଟେନ୍ ଆର୍. ଦେଶମୁଖ (୪ ଜଣ)',
    rescue_distance: '୦.୭ କିମି ଦୂର (ସମୟ: ୪ ମିନିଟ୍)',
    request_rescue_btn: 'ଉଦ୍ଧାର ସହାୟତା ମାଗନ୍ତୁ',
    request_sent: 'ଅନୁରୋଧ ପ୍ରେରିତ — ଟିମ୍ ଆଲଫା ରୱାନା',
    team_available: 'ଉପଲବ୍ଧ',
    team_deployed: 'ନିୟୋଜିତ',

    // Distress Signal Transmission Chain
    sos_button: 'ଆପାତକାଳୀନ SOS',
    distress_title: 'ଏନକ୍ରିପ୍ଟେଡ୍ ବିପଦ ସଙ୍କେତ',
    distress_protocol: 'AES-256 GCM • BLE ମେଶ୍ ପ୍ରୋଟୋକଲ୍',
    distress_step1_title: '୧. ବିପଦ ବାର୍ତ୍ତା ସ୍ଥାନୀୟ ଧାଡ଼ିରେ ସଂରକ୍ଷିତ',
    distress_step1_desc: 'ପ୍ୟାକେଟ୍ ଅଫଲାଇନରେ ଏନକ୍ରିପ୍ଟ ହେଲା',
    distress_step2_title: '୨. BLE ମେଶ୍ ରିଲେ ମିଳିଲା',
    distress_step2_desc: 'ପିଅର୍ ନୋଡ୍ 0x4F2A (ହପ୍ ୧) ଦ୍ୱାରା ପ୍ରେରିତ',
    distress_step3_title: '୩. LoRa / ସାଟେଲାଇଟ୍ ଗେଟୱେ',
    distress_step3_desc: 'ଉଚ୍ଚଭୂମି ରିଲେ ହବ୍ ଦ୍ୱାରା ସଂଯୋଗ ସ୍ଥାପିତ',
    distress_step4_title: '୪. କମାଣ୍ଡ ସେଣ୍ଟରରେ ଗୃହୀତ',
    distress_step4_desc: 'ଉଦ୍ଧାର ଅନୁମୋଦନ ନିଶ୍ଚିତ ହେଲା',
    transmit_distress_btn: 'ବିପଦ ପ୍ୟାକେଟ୍ ପ୍ରସାରଣ କରନ୍ତୁ',
    broadcast_in_progress: 'ମେଶ୍ ନେଟୱର୍କରେ ପ୍ରେରଣ ଚାଲିଛି...',
    rescue_confirmed: 'ଉଦ୍ଧାର ପ୍ରେରଣ ନିଶ୍ଚିତ',

    // Real-Time Flood Engine (Command Center)
    flood_engine_title: 'ରୟାଲ୍-ଟାଇମ୍ ବନ୍ୟା ବୃଦ୍ଧି ଇଞ୍ଜିନ୍',
    surge_active_badge: 'ବନ୍ୟା ବୃଦ୍ଧି ସକ୍ରିୟ',
    live_water_depth: 'ଜଳ ସ୍ତର',
    surge_velocity: 'ଜଳ ବୃଦ୍ଧି ବେଗ',
    forecast_12h_peak: '୧୨ ଘଣ୍ଟାର ସର୍ବୋଚ୍ଚ ସ୍ତର',
    simulate_surge_btn: 'ବନ୍ୟା ବୃଦ୍ଧି ସିମୁଲେସନ୍ ଆରମ୍ଭ',
    surging_progress: 'ସିମୁଲେସନ୍ ଚାଲୁଅଛି...',
    critical_breach_title: 'ଗୁରୁତର ବନ୍ୟା ସତର୍କତା',

    // BLE Mesh Network (Command Center)
    mesh_title: 'ଅଫଲାଇନ୍ ପିଅର୍ ମେଶ୍ ରିଲେ (BLE / Wi-Fi Direct)',
    blackout_active: 'ସେଲୁଲାର୍ ବ୍ଲାକଆଉଟ୍ - ମେଶ୍ ସକ୍ରିୟ',
    cellular_online: 'ସେଲୁଲାର୍ ଅନଲାଇନ୍',
    toggle_blackout: 'ନେଟୱର୍କ ବ୍ଲାକଆଉଟ୍ ଟଗଲ୍',
    broadcast_ping: 'ପିଙ୍ଗ୍ ହପ୍ ପ୍ରସାରଣ',
    encrypted_packet: 'AES-256 ଏନକ୍ରିପ୍ଟେଡ୍ ପ୍ୟାକେଟ୍',
    send_ack: 'ଏନକ୍ରିପ୍ଟେଡ୍ ACK ପଠାନ୍ତୁ',
    gps_satellite_active: 'ଜିପିଏସ୍ ଉପଗ୍ରହ: ସକ୍ରିୟ (3D ଫିକ୍ସ)',
    cellular_offline: 'ସେଲୁଲାର୍: ଅଫଲାଇନ୍ (BLE ମେଶ୍)',

    // Logistics Solver (Command Center)
    solver_title: 'ବହୁ-ଲକ୍ଷ୍ୟ ପ୍ରେରଣ ସମାଧାନ ପାରାମିଟର୍',
    compute_solver: 'ବଣ୍ଟନ ଗଣନା କରନ୍ତୁ',
    delay_reduction: 'ବିଳମ୍ବ ହ୍ରାସ',
    solver_comparison: 'ସମୟ ଏବଂ ବିପଦ ତୁଳନା',

    // AI Vision
    yolo_pipeline: 'YOLOv8 କମ୍ପ୍ୟୁଟର୍ ଭିଜନ୍ ପାଇପଲାଇନ୍',
    feed_drone: 'ଡ୍ରୋନ୍ ଆଲଫା (ସେକ୍ଟର B4)',
    feed_sat: 'ସାଟେଲାଇଟ୍ ସେଣ୍ଟିନେଲ୍-୨ SAR',
    feed_flir: 'FLIR ଥର୍ମାଲ୍ IR',
    run_inference: 'ପୁନଃ ଅନୁସନ୍ଧାନ କରନ୍ତୁ',
    scan_button: 'ଏଆଇ କ୍ୟାମେରା ସ୍କାନ୍ ଆରମ୍ଭ',

    // Common Controls
    close: 'ବନ୍ଦ କରନ୍ତୁ',
    dismiss: 'ଖାରଜ',
    navigate: 'ରାସ୍ତା ଦେଖନ୍ତୁ',
    details: 'ବିବରଣୀ',
    all: 'ସମସ୍ତ',
    filter: 'ଫିଲ୍ଟର୍',
    search: 'ଖୋଜନ୍ତୁ...',
    loading: 'ଲୋଡ୍ ହେଉଛି...'
  }
};

class I18nService {
  constructor() {
    this.currentLanguage = this.loadInitialLanguage();
    this.subscribers = new Set();
    this.broadcastChannel = null;

    this.initBroadcastChannel();
    this.initStorageListener();
  }

  loadInitialLanguage() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('resqnet_language');
      if (stored && translations[stored]) {
        return stored;
      }
    }
    return 'en';
  }

  initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('resqnet_global_i18n_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'LANGUAGE_CHANGE' && event.data.language) {
            this.applyLanguageInternal(event.data.language, false);
          }
        };
      }
    } catch (e) {
      console.warn('[I18nService] BroadcastChannel unavailable, relying on localStorage.');
    }
  }

  initStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'resqnet_language' && e.newValue && translations[e.newValue]) {
          this.applyLanguageInternal(e.newValue, false);
        }
      });
    }
  }

  getLanguage() {
    return this.currentLanguage;
  }

  setLanguage(lang) {
    if (!translations[lang]) {
      console.warn(`[I18nService] Unsupported language code: ${lang}, falling back to 'en'.`);
      lang = 'en';
    }
    this.applyLanguageInternal(lang, true);
  }

  applyLanguageInternal(lang, shouldBroadcast = true) {
    if (this.currentLanguage === lang && !shouldBroadcast) return;
    this.currentLanguage = lang;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('resqnet_language', lang);
      } catch (e) {}
    }

    if (shouldBroadcast && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'LANGUAGE_CHANGE',
          language: lang
        });
      } catch (e) {}
    }

    // Sync all dropdowns across the document
    if (typeof document !== 'undefined') {
      const selects = document.querySelectorAll('#sel-lang-switch, #sim-lang-switch, .global-lang-select');
      selects.forEach(s => {
        if (s.value !== lang) s.value = lang;
      });

      // Update static DOM elements immediately
      this.updateDOM();
    }

    // Notify all subscribers
    this.notifySubscribers();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    try {
      callback(this.currentLanguage);
    } catch (err) {
      console.error('[I18nService] Subscriber error:', err);
    }
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => {
      try {
        cb(this.currentLanguage);
      } catch (err) {
        console.error('[I18nService] Subscriber callback error:', err);
      }
    });
  }

  t(key, params = {}) {
    const langDict = translations[this.currentLanguage] || translations['en'];
    let str = langDict[key] || translations['en'][key] || key;

    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        str = str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramVal);
      });
    }
    return str;
  }

  formatNumber(num, options = {}) {
    if (typeof num !== 'number' || isNaN(num)) return num;
    try {
      const locale = this.getLocaleCode();
      return new Intl.NumberFormat(locale, options).format(num);
    } catch (e) {
      return num.toString();
    }
  }

  formatDistance(distanceKm) {
    if (typeof distanceKm !== 'number') return distanceKm;
    const locale = this.getLocaleCode();
    const isMeters = distanceKm < 1;
    const val = isMeters ? Math.round(distanceKm * 1000) : parseFloat(distanceKm.toFixed(1));
    const formattedNum = this.formatNumber(val);

    switch (this.currentLanguage) {
      case 'hi':
        return isMeters ? `${formattedNum} मी` : `${formattedNum} किमी`;
      case 'bn':
        return isMeters ? `${formattedNum} মি` : `${formattedNum} কিমি`;
      case 'or':
        return isMeters ? `${formattedNum} ମି` : `${formattedNum} କିମି`;
      default:
        return isMeters ? `${formattedNum} m` : `${formattedNum} km`;
    }
  }

  formatTime(minutes) {
    if (typeof minutes !== 'number') return minutes;
    const formattedNum = this.formatNumber(minutes);

    switch (this.currentLanguage) {
      case 'hi':
        return `${formattedNum} मिनट`;
      case 'bn':
        return `${formattedNum} মিনিট`;
      case 'or':
        return `${formattedNum} ମିନିଟ୍`;
      default:
        return `${formattedNum} min`;
    }
  }

  formatTimestamp(timestamp = Date.now()) {
    try {
      const locale = this.getLocaleCode();
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date(timestamp));
    } catch (e) {
      return new Date(timestamp).toLocaleTimeString();
    }
  }

  getLocaleCode() {
    switch (this.currentLanguage) {
      case 'hi': return 'hi-IN';
      case 'bn': return 'bn-IN';
      case 'or': return 'or-IN';
      default: return 'en-US';
    }
  }

  updateDOM(root = document) {
    if (!root) return;

    // Elements with data-i18n
    root.querySelectorAll('[data-i18n], [data-sim-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n') || el.getAttribute('data-sim-i18n');
      if (!key) return;

      const translated = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.placeholder) el.placeholder = translated;
        else el.value = translated;
      } else {
        el.textContent = translated;
      }
    });

    // Elements with data-i18n-placeholder
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = this.t(key);
    });

    // Elements with data-i18n-title
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        const str = this.t(key);
        el.title = str;
        el.setAttribute('aria-label', str);
      }
    });
  }
}

export const i18nService = new I18nService();

// Export helper shortcuts
export const t = (key, params) => i18nService.t(key, params);
export const getLang = () => i18nService.getLanguage();
export const setLang = (lang) => i18nService.setLanguage(lang);

if (typeof window !== 'undefined') {
  window.aegisI18n = i18nService;
}
