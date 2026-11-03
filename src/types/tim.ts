export type BusServiceType = 
  | 'PALLE_VELUGU' 
  | 'ORDINARY'
  | 'EXPRESS' 
  | 'ULTRA_DELUXE' 
  | 'SUPER_LUXURY' 
  | 'GARUDA_PLUS';

export interface BusStop {
  id: string;
  name: string;
  teluguName: string;
  stageNumber: number;
  distanceFromOriginKm: number;
  tollApplicable?: boolean;
}

export interface RouteData {
  routeId: string;
  routeNumber: string;
  name: string;
  teluguName: string;
  origin: string;
  destination: string;
  region: string;
  totalDistanceKm: number;
  stops: BusStop[];
}

export interface ConductorSession {
  conductorId: string;
  conductorName: string;
  depotCode: string;
  depotName: string;
  busNumber: string;
  routeId: string;
  serviceType: BusServiceType;
  tripNumber: number;
  waybillNumber: string;
  loginTime: string;
  timDeviceId: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT';
  supervisorPin: string; // default e.g. 9482
}

export type TicketCategory = 
  | 'PAID_GENERAL'
  | 'FREE_MAHILA'
  | 'CONCESSION_SENIOR'
  | 'CONCESSION_STUDENT'
  | 'CONCESSION_DIVYANGJAN';

export interface PassengerCount {
  adult: number;
  child: number;
  luggageKg: number;
}

export interface FareCalculation {
  baseFare: number;
  stageFare: number;
  tollTax: number;
  luggageFare: number;
  concessionDiscount: number;
  grossAmount: number;
  totalFare: number; // rounded to ₹5
  isZeroFare: boolean;
}

export interface AadhaarVerificationData {
  aadhaarNumberMasked: string; // e.g. XXXX-XXXX-4921
  name: string;
  gender: 'FEMALE' | 'MALE' | 'OTHER';
  yearOfBirth: string;
  age: number;
  state: string;
  photoUrl?: string;
  schemeName: string;
  verificationMethod: 'AADHAAR_SECURE_QR_DEMO';
  verifiedAt: string;
  isEligibleForFreeTravel: boolean;
  mobileNumberMasked: string; // e.g. +91 98XXX XX821
  smsNotificationSent: boolean;
  smsNotificationId?: string;
  smsTimestamp?: string;
}

export type TicketStatus = 'PAID' | 'ZERO_FARE_EXEMPT' | 'PENDING' | 'CANCELLED';

export interface TripAuditRecord {
  id: string;
  timestamp: string;
  action: 'CONFIGURED' | 'CORRECTION' | 'ENDED';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  note: string;
  authorizedByStaffId: string;
}

export interface ActiveTrip {
  tripId: string;
  tripNumber: number;
  busNumber: string;
  serviceType: BusServiceType;
  routeId: string;
  routeNumber: string;
  routeName: string;
  startingFromStop: BusStop;
  tripStartTimestamp: string;
  status: 'ACTIVE' | 'ENDED';
  endedAt?: string;
  totalTicketsIssued: number;
  totalRevenue: number;
  auditLogs: TripAuditRecord[];
}

export interface PassengerTicket {
  ticketId: string; // collision-resistant offline ID e.g. TIM7052-T3-20261103-0042
  tripId?: string; // links ticket to its specific active trip
  ticketNumber: string; // short conductor reference e.g. PV-983421
  transactionId: string; // unique transaction hash e.g. TXN-7052-9841-8932
  waybillNumber: string;
  issueTimestamp: string;
  routeId: string;
  routeNumber: string;
  routeName: string;
  serviceType: BusServiceType;
  fromStop: BusStop;
  toStop: BusStop;
  stagesTravelled: number;
  distanceKm: number;
  passengers: PassengerCount;
  category: TicketCategory;
  fare: FareCalculation;
  paymentMethod: 'CASH' | 'UPI' | 'ZERO_FARE_SCHEME';
  paymentStatus: TicketStatus;
  cashTendered?: number;
  changeReturned?: number;
  upiTransactionRef?: string;
  aadhaarDetails?: AadhaarVerificationData;
  qrPayload: string; // secure ticket reference payload (never sensitive personal data)
  syncedToCloud: boolean;
  syncedTimestamp?: string;
  timDeviceId: string;
  conductorId: string;
  busNumber: string;
  reprintCount?: number;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledByStaffId?: string;
}

export interface SyncAuditRecord {
  id: string;
  timestamp: string;
  ticketsUploadedCount: number;
  amountSynchronized: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  networkType: string;
  message: string;
}

export type SyncState = 'ONLINE' | 'OFFLINE' | 'PENDING_SYNC' | 'SYNC_COMPLETED' | 'SYNC_FAILED';

export interface DeviceTelemetry {
  timDeviceId: string;
  batteryPercentage: number;
  isCharging: boolean;
  paperRollPercentage: number;
  networkMode: 'OFFLINE' | '2G_EDGE' | '4G_ONLINE';
  syncState: SyncState;
  gpsLocked: boolean;
  currentLatLong: string;
  firmwareVersion: string;
  lastSyncTime: string | null;
}

export interface EditableFareConfig {
  serviceType: BusServiceType;
  name: string;
  teluguName: string;
  baseFare: number;
  ratePerStage: number;
  minDistanceKm: number;
  childDiscountPct: number;
  seniorDiscountPct: number;
  studentDiscountPct: number;
  isFreeMahilaEligible: boolean;
  tollFee: number;
}
