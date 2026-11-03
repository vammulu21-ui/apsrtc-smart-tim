import { 
  BusServiceType, 
  RouteData, 
  AadhaarVerificationData, 
  ConductorSession, 
  EditableFareConfig 
} from '../types/tim';

export interface ServiceTypeMeta {
  type: BusServiceType;
  name: string;
  teluguName: string;
  baseFare: number;
  ratePerStage: number; // in ₹ per stage (~6km)
  colorBg: string;
  colorBorder: string;
  colorText: string;
  badge: string;
  description: string;
  isPriorityDefault?: boolean;
}

export const APSRTC_SERVICE_TYPES: ServiceTypeMeta[] = [
  {
    type: 'PALLE_VELUGU',
    name: 'Palle Velugu',
    teluguName: 'పల్లె వెలుగు',
    baseFare: 10,
    ratePerStage: 8,
    colorBg: 'bg-emerald-600',
    colorBorder: 'border-emerald-600',
    colorText: 'text-emerald-700',
    badge: 'PRIORITY RURAL',
    description: 'Rural lifeline service. Free Mahila Stree Shakti scheme applies.',
    isPriorityDefault: true
  },
  {
    type: 'ORDINARY',
    name: 'Ordinary / City',
    teluguName: 'ఆర్డినరీ / సిటీ',
    baseFare: 10,
    ratePerStage: 7,
    colorBg: 'bg-teal-600',
    colorBorder: 'border-teal-600',
    colorText: 'text-teal-700',
    badge: 'PRIORITY TRANSIT',
    description: 'Suburban & town ordinary service. Zero-fare eligible.',
    isPriorityDefault: true
  },
  {
    type: 'EXPRESS',
    name: 'Express',
    teluguName: 'ఎక్స్‌ప్రెస్',
    baseFare: 20,
    ratePerStage: 12,
    colorBg: 'bg-blue-600',
    colorBorder: 'border-blue-600',
    colorText: 'text-blue-700',
    badge: 'INTER-CITY',
    description: 'Limited stop express service with quick transit.'
  },
  {
    type: 'ULTRA_DELUXE',
    name: 'Ultra Deluxe',
    teluguName: 'ఆల్ట్రా డీలక్స్',
    baseFare: 35,
    ratePerStage: 16,
    colorBg: 'bg-indigo-600',
    colorBorder: 'border-indigo-600',
    colorText: 'text-indigo-700',
    badge: '2X2 RECLINER',
    description: 'Semi-sleeper pushback seats comfort inter-district travel.'
  },
  {
    type: 'SUPER_LUXURY',
    name: 'Super Luxury',
    teluguName: 'సూపర్ లగ్జరీ',
    baseFare: 45,
    ratePerStage: 20,
    colorBg: 'bg-purple-600',
    colorBorder: 'border-purple-600',
    colorText: 'text-purple-700',
    badge: 'AIR SUSPENSION',
    description: 'Non-stop inter-district luxury air-suspension coach.'
  },
  {
    type: 'GARUDA_PLUS',
    name: 'Garuda Plus',
    teluguName: 'గరుడ ప్లస్',
    baseFare: 80,
    ratePerStage: 32,
    colorBg: 'bg-amber-600',
    colorBorder: 'border-amber-600',
    colorText: 'text-amber-700',
    badge: 'AC MULTI-AXLE',
    description: 'Multi-axle AC premium high-speed corridor express.'
  }
];

export const DEMO_ROUTES: RouteData[] = [
  {
    routeId: 'RT-116',
    routeNumber: '116',
    name: 'Vijayawada (PNBS) ⇄ Guntur (NTR Bus Station)',
    teluguName: 'విజయవాడ (పీఎన్‌బీఎస్) ⇄ గుంటూరు (ఎన్టీఆర్ బస్టాండ్)',
    origin: 'Vijayawada PNBS',
    destination: 'Guntur NTR Bus Station',
    region: 'Krishna - Guntur (Amaravati Capital Region)',
    totalDistanceKm: 34,
    stops: [
      { id: 'ST-101', name: 'Vijayawada PNBS', teluguName: 'విజయవాడ పీఎన్‌బీఎస్', stageNumber: 1, distanceFromOriginKm: 0 },
      { id: 'ST-102', name: 'Varadhi Junction', teluguName: 'వారధి జంక్షన్', stageNumber: 2, distanceFromOriginKm: 4 },
      { id: 'ST-103', name: 'Tadepalli', teluguName: 'తాడేపల్లి', stageNumber: 3, distanceFromOriginKm: 8 },
      { id: 'ST-104', name: 'Mangalagiri Bypass', teluguName: 'మంగళగిరి బైపాస్', stageNumber: 4, distanceFromOriginKm: 14, tollApplicable: true },
      { id: 'ST-105', name: 'Kaza Toll Plaza', teluguName: 'కాజా టోల్ ప్లాజా', stageNumber: 5, distanceFromOriginKm: 20, tollApplicable: true },
      { id: 'ST-106', name: 'Nambur (ANU)', teluguName: 'నంబూరు (ఆచార్య నాగార్జున వర్సిటీ)', stageNumber: 6, distanceFromOriginKm: 25 },
      { id: 'ST-107', name: 'Autonagar Guntur', teluguName: 'ఆటోనగర్ గుంటూరు', stageNumber: 7, distanceFromOriginKm: 30 },
      { id: 'ST-108', name: 'Guntur NTR Bus Station', teluguName: 'గుంటూరు ఎన్టీఆర్ బస్టాండ్', stageNumber: 8, distanceFromOriginKm: 34 }
    ]
  },
  {
    routeId: 'RT-211',
    routeNumber: '211',
    name: 'Tirupati (Central) ⇄ Madanapalle Bus Station',
    teluguName: 'తిరుపతి (సెంట్రల్) ⇄ మదనపల్లె బస్టాండ్',
    origin: 'Tirupati Central Bus Station',
    destination: 'Madanapalle Bus Station',
    region: 'Chittoor - Annamayya Region',
    totalDistanceKm: 118,
    stops: [
      { id: 'ST-201', name: 'Tirupati Central BS', teluguName: 'తిరుపతి సెంట్రల్ బస్టాండ్', stageNumber: 1, distanceFromOriginKm: 0 },
      { id: 'ST-202', name: 'Chandragiri Cross', teluguName: 'చంద్రగిరి క్రాస్', stageNumber: 2, distanceFromOriginKm: 12 },
      { id: 'ST-203', name: 'Bakrapeta', teluguName: 'బాక్రాపేట ఘాట్', stageNumber: 3, distanceFromOriginKm: 28 },
      { id: 'ST-204', name: 'Pileru Junction', teluguName: 'పీలేరు జంక్షన్', stageNumber: 4, distanceFromOriginKm: 55 },
      { id: 'ST-205', name: 'Kalikiri', teluguName: 'కలికిరి', stageNumber: 5, distanceFromOriginKm: 76 },
      { id: 'ST-206', name: 'Valmikipuram (Vayalpad)', teluguName: 'వాల్మీకిపురం (వాయల్పాడు)', stageNumber: 6, distanceFromOriginKm: 94 },
      { id: 'ST-207', name: 'Madanapalle Bus Station', teluguName: 'మదనపల్లె బస్టాండ్', stageNumber: 7, distanceFromOriginKm: 118 }
    ]
  },
  {
    routeId: 'RT-345',
    routeNumber: '345',
    name: 'Visakhapatnam (Dwaraka) ⇄ Srikakulam Complex',
    teluguName: 'విశాఖపట్నం (ద్వారక) ⇄ శ్రీకాకుళం కాంప్లెక్స్',
    origin: 'Visakhapatnam Dwaraka RTC Complex',
    destination: 'Srikakulam RTC Complex',
    region: 'Uttarandhra Coastal Corridor',
    totalDistanceKm: 104,
    stops: [
      { id: 'ST-301', name: 'Visakhapatnam Dwaraka Complex', teluguName: 'విశాఖపట్నం ద్వారక కాంప్లెక్స్', stageNumber: 1, distanceFromOriginKm: 0 },
      { id: 'ST-302', name: 'Maddilapalem', teluguName: 'మద్దిలపాలెం', stageNumber: 2, distanceFromOriginKm: 6 },
      { id: 'ST-303', name: 'Madhurawada Junction', teluguName: 'మధురవాడ జంక్షన్', stageNumber: 3, distanceFromOriginKm: 16 },
      { id: 'ST-304', name: 'Anandapuram Toll', teluguName: 'ఆనందపురం టోల్', stageNumber: 4, distanceFromOriginKm: 26, tollApplicable: true },
      { id: 'ST-305', name: 'Tagarapuvalasa', teluguName: 'తగరపువలస', stageNumber: 5, distanceFromOriginKm: 38 },
      { id: 'ST-306', name: 'Nathavalasa Toll', teluguName: 'నాతవలస టోల్ గేట్', stageNumber: 6, distanceFromOriginKm: 54, tollApplicable: true },
      { id: 'ST-307', name: 'Ranasthalam', teluguName: 'రణస్థలం', stageNumber: 7, distanceFromOriginKm: 78 },
      { id: 'ST-308', name: 'Srikakulam RTC Complex', teluguName: 'శ్రీకాకుళం ఆర్టీసీ కాంప్లెక్స్', stageNumber: 8, distanceFromOriginKm: 104 }
    ]
  },
  {
    routeId: 'RT-052',
    routeNumber: '52',
    name: 'Kurnool Old Bus Stand ⇄ Anantapur RTC Complex',
    teluguName: 'కర్నూలు పాత బస్టాండ్ ⇄ అనంతపురం ఆర్టీసీ కాంప్లెక్స్',
    origin: 'Kurnool Old Bus Stand',
    destination: 'Anantapur RTC Complex',
    region: 'Rayalaseema Express Corridor',
    totalDistanceKm: 148,
    stops: [
      { id: 'ST-501', name: 'Kurnool Old Bus Stand', teluguName: 'కర్నూలు పాత బస్టాండ్', stageNumber: 1, distanceFromOriginKm: 0 },
      { id: 'ST-502', name: 'Veldurthi', teluguName: 'వెల్దుర్తి', stageNumber: 2, distanceFromOriginKm: 32 },
      { id: 'ST-503', name: 'Dhone Junction', teluguName: 'డోన్ జంక్షన్', stageNumber: 3, distanceFromOriginKm: 52 },
      { id: 'ST-504', name: 'Pyapili', teluguName: 'ప్యాపిలి', stageNumber: 4, distanceFromOriginKm: 78 },
      { id: 'ST-505', name: 'Gooty Toll Gate', teluguName: 'గుత్తి టోల్ గేట్', stageNumber: 5, distanceFromOriginKm: 98, tollApplicable: true },
      { id: 'ST-506', name: 'Pamidi Cross', teluguName: 'పామిడి క్రాస్', stageNumber: 6, distanceFromOriginKm: 122 },
      { id: 'ST-507', name: 'Anantapur RTC Complex', teluguName: 'అనంతపురం ఆర్టీసీ కాంప్లెక్స్', stageNumber: 7, distanceFromOriginKm: 148 }
    ]
  },
  {
    routeId: 'RT-064',
    routeNumber: '64',
    name: 'Rajahmundry (Gokavaram) ⇄ Eluru Old Bus Stand',
    teluguName: 'రాజమండ్రి (గోకవరం స్టాండ్) ⇄ ఏలూరు పాత బస్టాండ్',
    origin: 'Rajahmundry Gokavaram Stand',
    destination: 'Eluru Old Bus Stand',
    region: 'Godavari Delta Corridor',
    totalDistanceKm: 96,
    stops: [
      { id: 'ST-601', name: 'Rajahmundry Gokavaram Stand', teluguName: 'రాజమండ్రి గోకవరం స్టాండ్', stageNumber: 1, distanceFromOriginKm: 0 },
      { id: 'ST-602', name: 'Morampudi Junction', teluguName: 'మోరంపూడి జంక్షన్', stageNumber: 2, distanceFromOriginKm: 8 },
      { id: 'ST-603', name: 'Ravulapalem', teluguName: 'రావులపాలెం', stageNumber: 3, distanceFromOriginKm: 32 },
      { id: 'ST-604', name: 'Siddhantham Toll', teluguName: 'సిద్ధాంతం టోల్ ప్లాజా', stageNumber: 4, distanceFromOriginKm: 44, tollApplicable: true },
      { id: 'ST-605', name: 'Tanuku Bypass', teluguName: 'తణుకు బైపాస్', stageNumber: 5, distanceFromOriginKm: 56 },
      { id: 'ST-606', name: 'Tadepalligudem Complex', teluguName: 'తాడేపల్లిగూడెం కాంప్లెక్స్', stageNumber: 6, distanceFromOriginKm: 74 },
      { id: 'ST-607', name: 'Eluru Old Bus Stand', teluguName: 'ఏలూరు పాత బస్టాండ్', stageNumber: 7, distanceFromOriginKm: 96 }
    ]
  }
];

export const DEFAULT_CONDUCTOR_SESSION: ConductorSession = {
  conductorId: 'EMP-9482',
  conductorName: 'C. Venkateswara Rao',
  depotCode: 'GNT-1',
  depotName: 'Guntur-1 Depot',
  busNumber: 'AP29Z 4582',
  routeId: 'RT-116',
  serviceType: 'PALLE_VELUGU',
  tripNumber: 3,
  waybillNumber: 'WB-2026-9841',
  loginTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  timDeviceId: 'AP-TIM-7052',
  shift: 'MORNING',
  supervisorPin: '9482'
};

export interface DemoAadhaarCard {
  id: string;
  name: string;
  teluguName: string;
  maskedAadhaar: string;
  gender: 'FEMALE' | 'MALE' | 'OTHER';
  dob: string;
  age: number;
  mobileMasked: string;
  state: string;
  district: string;
  eligibleCategory: string;
  schemeTitle: string;
  avatarBg: string;
  qrSimulationPayload: string;
}

export const DEMO_AADHAAR_DATABASE: DemoAadhaarCard[] = [
  {
    id: 'ADH-01',
    name: 'Lakshmi Devi Chunduru',
    teluguName: 'లక్ష్మీదేవి చుండూరు',
    maskedAadhaar: 'XXXX-XXXX-4921',
    gender: 'FEMALE',
    dob: '1988-04-12',
    age: 38,
    mobileMasked: '+91 9848X XX421',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    eligibleCategory: 'FREE_MAHILA',
    schemeTitle: 'Maha Lakshmi / Stree Shakti Zero-Fare Scheme',
    avatarBg: 'bg-rose-500',
    qrSimulationPayload: 'UIDAI:DEMO:V4:F:4921:LakshmiDeviChunduru:1988:AP:APSRTC_MAHILA_PASS_ELIGIBLE'
  },
  {
    id: 'ADH-02',
    name: 'Venkata Subba Rao Garu',
    teluguName: 'వెంకట సుబ్బా రావు గారు',
    maskedAadhaar: 'XXXX-XXXX-8104',
    gender: 'MALE',
    dob: '1958-09-15',
    age: 68,
    mobileMasked: '+91 9440X XX104',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    eligibleCategory: 'CONCESSION_SENIOR',
    schemeTitle: 'Senior Citizen Concession (25% Discount)',
    avatarBg: 'bg-amber-600',
    qrSimulationPayload: 'UIDAI:DEMO:V4:M:8104:VenkataSubbaRao:1958:AP:SENIOR_CITIZEN_ELIGIBLE'
  },
  {
    id: 'ADH-03',
    name: 'Sravani Ankem (Student)',
    teluguName: 'శ్రావణి అంకెమ్ (విద్యార్థిని)',
    maskedAadhaar: 'XXXX-XXXX-3372',
    gender: 'FEMALE',
    dob: '2005-11-20',
    age: 21,
    mobileMasked: '+91 7995X XX372',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    eligibleCategory: 'FREE_MAHILA',
    schemeTitle: 'Student + Mahila Free Rural Transport',
    avatarBg: 'bg-purple-600',
    qrSimulationPayload: 'UIDAI:DEMO:V4:F:3372:SravaniAnkem:2005:AP:STUDENT_MAHILA_ELIGIBLE'
  },
  {
    id: 'ADH-04',
    name: 'Prasad Babu K.',
    teluguName: 'ప్రసాద్ బాబు కె.',
    maskedAadhaar: 'XXXX-XXXX-9018',
    gender: 'MALE',
    dob: '1992-06-03',
    age: 34,
    mobileMasked: '+91 9177X XX018',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    eligibleCategory: 'PAID_GENERAL',
    schemeTitle: 'General Passenger (Regular Tariff)',
    avatarBg: 'bg-blue-600',
    qrSimulationPayload: 'UIDAI:DEMO:V4:M:9018:PrasadBabuK:1992:AP:GENERAL_TARIFF'
  }
];

// Offline collision-resistant ticket generator
const TICKET_SEQ_KEY = 'apsrtc_ticket_counter_v1';

export function getNextOfflineTicketSequence(): number {
  try {
    const cur = Number(localStorage.getItem(TICKET_SEQ_KEY) || '1040');
    const next = cur + 1;
    localStorage.setItem(TICKET_SEQ_KEY, next.toString());
    return next;
  } catch {
    return Math.floor(1000 + Math.random() * 9000);
  }
}

export function generateCollisionResistantTicketId(
  timDeviceId: string, 
  tripNumber: number, 
  serviceType: BusServiceType
): { ticketId: string; ticketNumber: string; transactionId: string } {
  const seq = getNextOfflineTicketSequence();
  const dateCompact = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = serviceType === 'PALLE_VELUGU' ? 'PV' : serviceType === 'ORDINARY' ? 'ORD' : 'EXP';
  
  // Format: TIM7052-T3-20261103-1041
  const ticketId = `${timDeviceId.replace(/[^A-Z0-9]/gi, '')}-T${tripNumber}-${dateCompact}-${seq}`;
  const ticketNumber = `${prefix}-${seq}`;
  const transactionId = `TXN-${timDeviceId.replace(/[^A-Z0-9]/gi, '').slice(-4)}-S${seq}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  return { ticketId, ticketNumber, transactionId };
}

// Configurable Demo Fare Charts in local storage
const FARE_CONFIG_KEY = 'apsrtc_editable_fare_charts_v1';

export function getEditableFareConfigs(): EditableFareConfig[] {
  try {
    const raw = localStorage.getItem(FARE_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  // Default demo fare configuration
  const defaults: EditableFareConfig[] = [
    {
      serviceType: 'PALLE_VELUGU',
      name: 'Palle Velugu',
      teluguName: 'పల్లె వెలుగు',
      baseFare: 10,
      ratePerStage: 8,
      minDistanceKm: 6,
      childDiscountPct: 50,
      seniorDiscountPct: 25,
      studentDiscountPct: 50,
      isFreeMahilaEligible: true,
      tollFee: 5
    },
    {
      serviceType: 'ORDINARY',
      name: 'Ordinary / City',
      teluguName: 'ఆర్డినరీ / సిటీ',
      baseFare: 10,
      ratePerStage: 7,
      minDistanceKm: 5,
      childDiscountPct: 50,
      seniorDiscountPct: 25,
      studentDiscountPct: 50,
      isFreeMahilaEligible: true,
      tollFee: 0
    },
    {
      serviceType: 'EXPRESS',
      name: 'Express',
      teluguName: 'ఎక్స్‌ప్రెస్',
      baseFare: 20,
      ratePerStage: 12,
      minDistanceKm: 12,
      childDiscountPct: 50,
      seniorDiscountPct: 25,
      studentDiscountPct: 50,
      isFreeMahilaEligible: false,
      tollFee: 10
    },
    {
      serviceType: 'ULTRA_DELUXE',
      name: 'Ultra Deluxe',
      teluguName: 'ఆల్ట్రా డీలక్స్',
      baseFare: 35,
      ratePerStage: 16,
      minDistanceKm: 20,
      childDiscountPct: 50,
      seniorDiscountPct: 25,
      studentDiscountPct: 30,
      isFreeMahilaEligible: false,
      tollFee: 15
    },
    {
      serviceType: 'SUPER_LUXURY',
      name: 'Super Luxury',
      teluguName: 'సూపర్ లగ్జరీ',
      baseFare: 45,
      ratePerStage: 20,
      minDistanceKm: 30,
      childDiscountPct: 50,
      seniorDiscountPct: 20,
      studentDiscountPct: 0,
      isFreeMahilaEligible: false,
      tollFee: 20
    },
    {
      serviceType: 'GARUDA_PLUS',
      name: 'Garuda Plus',
      teluguName: 'గరుడ ప్లస్',
      baseFare: 80,
      ratePerStage: 32,
      minDistanceKm: 50,
      childDiscountPct: 50,
      seniorDiscountPct: 15,
      studentDiscountPct: 0,
      isFreeMahilaEligible: false,
      tollFee: 25
    }
  ];

  localStorage.setItem(FARE_CONFIG_KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveEditableFareConfigs(configs: EditableFareConfig[]): void {
  try {
    localStorage.setItem(FARE_CONFIG_KEY, JSON.stringify(configs));
  } catch {
    // fallback
  }
}

export function calculateApsrtcTicketFare(params: {
  serviceType: BusServiceType;
  stagesTravelled: number;
  tollApplicable: boolean;
  adultCount: number;
  childCount: number;
  luggageKg: number;
  isMahilaZeroFare: boolean;
  concessionType?: 'NONE' | 'SENIOR' | 'STUDENT' | 'DIVYANGJAN';
}) {
  const configs = getEditableFareConfigs();
  const cfg = configs.find(c => c.serviceType === params.serviceType) || configs[0];

  // Stages minimum is 1
  const stages = Math.max(1, params.stagesTravelled);
  
  // Single adult tariff
  const singleAdultBase = cfg.baseFare;
  const singleAdultStageCost = (stages - 1) * cfg.ratePerStage;
  const singleAdultTicket = singleAdultBase + singleAdultStageCost;
  
  // Child fare with configured child discount (standard 50%)
  const childMultiplier = (100 - cfg.childDiscountPct) / 100;
  const singleChildTicket = Math.round(singleAdultTicket * childMultiplier);
  
  // Luggage: 20kg free, then ₹10 per 10kg per 3 stages
  const excessLuggageKg = Math.max(0, params.luggageKg - 20);
  const luggageFare = excessLuggageKg > 0 ? Math.ceil(excessLuggageKg / 10) * 10 * Math.ceil(stages / 3) : 0;
  
  // Toll fee if route segment crosses toll plaza
  const tollFeePerPax = params.tollApplicable ? cfg.tollFee : 0;
  
  // Free Mahila Scheme handling
  if (params.isMahilaZeroFare && cfg.isFreeMahilaEligible) {
    return {
      baseFare: 0,
      stageFare: 0,
      tollTax: 0,
      luggageFare: luggageFare,
      concessionDiscount: (singleAdultTicket + tollFeePerPax) * params.adultCount,
      grossAmount: luggageFare,
      totalFare: luggageFare,
      isZeroFare: luggageFare === 0
    };
  }
  
  const adultSubtotal = (singleAdultTicket + tollFeePerPax) * params.adultCount;
  const childSubtotal = (singleChildTicket + (params.tollApplicable ? Math.round(cfg.tollFee * 0.5) : 0)) * params.childCount;
  
  const grossFare = adultSubtotal + childSubtotal + luggageFare;
  let concessionDiscount = 0;
  
  if (params.concessionType === 'SENIOR') {
    concessionDiscount = Math.round(adultSubtotal * (cfg.seniorDiscountPct / 100));
  } else if (params.concessionType === 'STUDENT') {
    concessionDiscount = Math.round(adultSubtotal * (cfg.studentDiscountPct / 100));
  } else if (params.concessionType === 'DIVYANGJAN') {
    concessionDiscount = Math.round(adultSubtotal * 0.5);
  }
  
  const netFareBeforeRounding = Math.max(0, grossFare - concessionDiscount);
  // APSRTC standard round-up to nearest ₹5
  const totalFare = Math.ceil(netFareBeforeRounding / 5) * 5;
  
  return {
    baseFare: singleAdultBase * params.adultCount + (singleChildTicket * 0.5 * params.childCount),
    stageFare: singleAdultStageCost * params.adultCount,
    tollTax: tollFeePerPax * (params.adultCount + params.childCount),
    luggageFare,
    concessionDiscount,
    grossAmount: grossFare,
    totalFare,
    isZeroFare: totalFare === 0
  };
}
