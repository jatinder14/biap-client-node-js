export const constants = {
    CORE_VERSION: "1.0.0",
    TTL2D: "P2D",
    CURRENCY_TYPE: "INR",
    NOT_APPLICABLE: "na",
    ACCOUNT_TYPE: "01",
    COUNTRY: "IND",
    PAID: "PAID",
    SUBSCRIBED: "SUBSCRIBED",
    DEFAULT_DOMAIN: "ONDC:NTS10",
  }
  export const actions = {
    SETTLE: "settle",
    ON_SETTLE: "on_settle",
    RECEIVER_RECON: "receiver_recon",
    ON_RECEIVER_RECON: "on_receiver_recon",
    ON_COLLECTOR_RECON: "on_collector_recon",
    ON_RECON_STATUS: "on_recon_status",
    LOOKUP: "lookup",
  }
  
  export const recon_status = {
    PAID: "01",
    OVERPAID: "02",
    UNDERPAID: "03",
    NOTPAID: "04",
  }
  