export interface SMSNotificationRecord {
  id: string;
  recipientPhoneMasked: string;
  passengerName: string;
  maskedAadhaar: string;
  ticketNumber: string;
  busNumber: string;
  routeName: string;
  messageContent: string;
  timestamp: string;
  deliveryStatus: 'DISPATCHED_DEMO' | 'DELIVERED_SIMULATED' | 'FAILED_GATEWAY_UNAVAILABLE';
  isIntegrationSimulated: boolean;
  technicalNotice: string;
}

const SMS_HISTORY_KEY = 'apsrtc_sms_notifications_v1';

class SMSService {
  // Clear architectural notice on why real SMS is restricted
  public static readonly INTEGRATION_DISCLAIMER = 
    "PROTOTYPE NOTICE: Actual Aadhaar-linked mobile SMS dispatch requires UIDAI Sub-AUA/KUA statutory authorization, TRAI DLT approved template headers (APSRTC-APGOVT), and production C-DAC / NIC / Telecom aggregator gateway connectivity. In this standalone TIM prototype, SMS notifications execute via the high-fidelity demo pipeline with realistic telecommunication payload structures.";

  getSMSHistory(): SMSNotificationRecord[] {
    try {
      const data = localStorage.getItem(SMS_HISTORY_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return [];
  }

  // Trigger immediate SMS notification workflow after successful Aadhaar demo scan
  dispatchDemoSMS(params: {
    recipientPhoneMasked: string;
    passengerName: string;
    maskedAadhaar: string;
    ticketNumber: string;
    busNumber: string;
    routeNumber: string;
    fromStop: string;
    toStop: string;
    isZeroFare: boolean;
  }): SMSNotificationRecord {
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const messageContent = params.isZeroFare
      ? `APSRTC TICKET: Zero-fare Mahila concession verified for Aadhaar ${params.maskedAadhaar} on Bus ${params.busNumber}, Route ${params.routeNumber} (${params.fromStop} -> ${params.toStop}). Tkt No: ${params.ticketNumber}. Date: ${dateStr} ${timestamp}. Shubh Yatra - APSRTC.`
      : `APSRTC TICKET: Confirmed ticket ${params.ticketNumber} for ${params.passengerName}. Bus: ${params.busNumber}, Route: ${params.routeNumber} (${params.fromStop} -> ${params.toStop}). Date: ${dateStr}. Shubh Yatra - APSRTC.`;

    const record: SMSNotificationRecord = {
      id: `SMS-${Date.now().toString().slice(-6)}`,
      recipientPhoneMasked: params.recipientPhoneMasked,
      passengerName: params.passengerName,
      maskedAadhaar: params.maskedAadhaar,
      ticketNumber: params.ticketNumber,
      busNumber: params.busNumber,
      routeName: `${params.fromStop} - ${params.toStop}`,
      messageContent,
      timestamp: `${dateStr} ${timestamp}`,
      deliveryStatus: 'DELIVERED_SIMULATED',
      isIntegrationSimulated: true,
      technicalNotice: 'Simulated via APSRTC Gateway Demo Engine. Real-world dispatch requires C-DAC/NIC SMPP integration.'
    };

    const history = this.getSMSHistory();
    history.unshift(record);
    try {
      localStorage.setItem(SMS_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    } catch {
      // fallback
    }

    return record;
  }
}

export const smsService = new SMSService();
