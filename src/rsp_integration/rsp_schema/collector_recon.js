const collectorReconSchema = {
  type: "object",
  properties: {
    context: {
      type: "object",
      properties: {
        domain: { type: "string", enum: ["ONDC:NTS10"] },
        country: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
        city: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
        action: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
        core_version: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
        bap_id: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
        bap_uri: { type: "string" },
        bpp_id: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
        bpp_uri: { type: "string", },
        transaction_id: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
        message_id: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
        timestamp: { type: "string",  },
        ttl: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
      },
      errorMessage: {
        properties: {
          country: "country should be valid and must not be empty.",
          city: "city should be valid and must not be empty.",
          action: "action should be valid and must not be empty.",
          core_version: "core_version should be valid and must not be empty.",
          bap_id: "bap_id should be valid and must not be empty.",
          bap_uri: "bap_uri should be valid and must not be empty.",
          bpp_id: "bpp_id should be valid and must not be empty.",
          bpp_uri: "bpp_uri should be valid and must not be empty.",
          transaction_id: "transaction_id should be valid and must not be empty.",
          message_id: "message_id should be valid and must not be empty.",
          timestamp: "timestamp should be valid and must not be empty.",
          ttl: "ttl should be valid and must not be empty.",
        },
      },
      required: [
        "domain",
        "country",
        "city",
        "action",
        "core_version",
        "bap_id",
        "bap_uri",
        "bpp_id",
        "bpp_uri",
        "transaction_id",
        "message_id",
        "timestamp",
        "ttl",
      ],
    },
    message: {
      type: "object",
      properties: {
        orderbook: {
          type: "object",
          properties: {
            orders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                  invoice_no: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                  collector_app_id: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                  receiver_app_id: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                  receiver_app_uri: { type: "string", },
                  state: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                  provider: {
                    type: "object",
                    properties: {
                      name: {
                        type: "object",
                        properties: {
                          name: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                          code: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                        },
                        errorMessage: {
                          properties: {
                            name: "provider name should be valid and must not be empty.",
                            code: "provider code should be valid and must not be empty.",
                          },
                        },
                        required: ["name", "code"],
                      },
                      address: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                    },
                    errorMessage: {
                      properties: {
                        address: "provider address should be valid and must not be empty.",
                      },
                    },
                    required: ["name", "address"],
                  },
                  payment: {
                    type: "object",
                    properties: {
                      // uri: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      // tl_method: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      params: {
                        type: "object",
                        properties: {
                          // transaction_id: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                          // transaction_status: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                          amount: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                          currency: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                        },
                        errorMessage: {
                          properties: {
                            // transaction_id: "payment transaction_id should be valid and must not be empty.",
                            // transaction_status: "payment transaction_status should be valid and must not be empty.",
                            amount: "payment amount should be valid and must not be empty.",
                            currency: "payment currency should be valid and must not be empty.",
                          },
                        },
                        required: ["amount", "currency"], // "transaction_id", "transaction_status",
                      },
                      type: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      status: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      collected_by: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      "@ondc/org/collected_by_status": { type: "string", minLength: 1 },
                      "@ondc/org/buyer_app_finder_fee_type": { type: "string", minLength: 1 },
                      "@ondc/org/buyer_app_finder_fee_amount": { type: "string", minLength: 1 },
                      // "@ondc/org/withholding_amount": { type: "string", minLength: 1 },
                      "@ondc/org/withholding_amount_status": { type: "string", minLength: 1 },
                      "@ondc/org/return_window": { type: "string", minLength: 1 },
                      "@ondc/org/return_window_status": { type: "string", minLength: 1 },
                      // "@ondc/org/settlement_basis": { type: "string", minLength: 1 },
                      "@ondc/org/settlement_basis_status": { type: "string", minLength: 1 },
                      // "@ondc/org/settlement_window": { type: "string", minLength: 1 },
                      "@ondc/org/settlement_window_status": { type: "string", minLength: 1 },
                      "@ondc/org/settlement_details": {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            settlement_counterparty: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            settlement_phase: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            settlement_amount: { type: "number" },
                            settlement_type: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            settlement_bank_account_no: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            settlement_ifsc_code: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            // upi_address: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            bank_name: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            branch_name: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            beneficiary_name: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            beneficiary_address: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            settlement_status: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                            // settlement_timestamp: { type: "string",  },
                          },
                          errorMessage: {
                            properties: {
                              settlement_counterparty:
                                "@ondc/org/settlement_details > settlement_counterparty should be valid and must not be empty.",
                              settlement_phase:
                                "@ondc/org/settlement_details > settlement_phase should be valid and must not be empty.",
                              settlement_amount:
                                "@ondc/org/settlement_details > settlement_amount should be valid and must not be empty.",
                              settlement_type:
                                "@ondc/org/settlement_details > settlement_type should be valid and must not be empty.",
                              settlement_bank_account_no:
                                "@ondc/org/settlement_details > settlement_bank_account_no should be valid and must not be empty.",
                              settlement_ifsc_code:
                                "@ondc/org/settlement_details > settlement_ifsc_code should be valid and must not be empty.",
                              // upi_address: "@ondc/org/settlement_details > upi_address should be valid and must not be empty.",
                              bank_name:
                                "@ondc/org/settlement_details > bank_name should be valid and must not be empty.",
                              beneficiary_name:
                                "@ondc/org/settlement_details > beneficiary_name should be valid and must not be empty.",
                              beneficiary_address:
                                "@ondc/org/settlement_details > beneficiary_address should be valid and must not be empty.",
                              settlement_status:
                                "@ondc/org/settlement_details > settlement_status should be valid and must not be empty.",
                              // settlement_timestamp:
                              //   "@ondc/org/settlement_details > settlement_timestamp should be valid and must not be empty.",
                            },
                          },
                          required: [
                            "settlement_counterparty",
                            "settlement_phase",
                            "settlement_amount",
                            "settlement_type",
                            "settlement_bank_account_no",
                            "settlement_ifsc_code",
                            // "upi_address",
                            "bank_name",
                            "branch_name",
                            "beneficiary_name",
                            "beneficiary_address",
                            "settlement_status",
                          ],
                        },
                      },
                    },
                    errorMessage: {
                      properties: {
                        // uri: "payment > uri should be valid and must not be empty.",
                        // tl_method: "payment > tl_method should be valid and must not be empty.",
                        type: "payment > type should be valid and must not be empty.",
                        status: "payment > status should be valid and must not be empty.",
                        collected_by: "payment > collected_by should be valid and must not be empty.",
                      },
                    },
                    required: [
                      // "uri",
                      // "tl_method",
                      "params",
                      "type",
                      "status",
                      "collected_by",
                      // "@ondc/org/collected_by_status",
                      "@ondc/org/buyer_app_finder_fee_type",
                      "@ondc/org/buyer_app_finder_fee_amount",
                      // "@ondc/org/withholding_amount",
                      // "@ondc/org/withholding_amount_status",
                      "@ondc/org/return_window",
                      // "@ondc/org/return_window_status",
                      // "@ondc/org/settlement_basis",
                      // "@ondc/org/settlement_basis_status",
                      // "@ondc/org/settlement_window",
                      // "@ondc/org/settlement_window_status",
                      "@ondc/org/settlement_details",
                    ],
                  },
                  withholding_tax_gst: {
                    type: "object",
                    properties: {
                      currency: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      value: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                    },
                    errorMessage: {
                      properties: {
                        currency: "withholding_tax_gst > currency should be valid and must not be empty.",
                        value: "withholding_tax_gst > value should be valid and must not be empty.",
                      },
                    },
                    required: ["currency", "value"],
                  },
                  withholding_tax_tds: {
                    type: "object",
                    properties: {
                      currency: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      value: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                    },
                    errorMessage: {
                      properties: {
                        currency: "withholding_tax_tds > currency should be valid and must not be empty.",
                        value: "withholding_tax_tds > value should be valid and must not be empty.",
                      },
                    },
                    required: ["currency", "value"],
                  },
                  deduction_by_collector: {
                    type: "object",
                    properties: {
                      currency: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      value: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                    },
                    errorMessage: {
                      properties: {
                        currency: "deduction_by_collector > currency should be valid and must not be empty.",
                        value: "deduction_by_collector > value should be valid and must not be empty.",
                      },
                    },
                    required: ["currency", "value"],
                  },
                  order_recon_status: { type: "null" },
                  payerdetails: {
                    type: "object",
                    properties: {
                      payer_name: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      payer_address: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      payer_account_no: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      payer_bank_code: { type: "string", minLength: 11, pattern: "^(?!\\s*$).+" },
                      // payer_virtual_payment_address: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                    },
                    errorMessage: {
                      properties: {
                        payer_name: "payerdetails > payer_name should be valid and must not be empty.",
                        payer_address: "payerdetails > payer_address should be valid and must not be empty.",
                        payer_account_no: "payerdetails > payer_account_no should be valid and must not be empty.",
                        payer_bank_code: "payerdetails > payer_bank_code should be valid and must not be empty.",
                        // payer_virtual_payment_address: "payerdetails > payer_virtual_payment_address should be valid and must not be empty.",
                      },
                    },
                    required: [
                      "payer_name",
                      "payer_address",
                      "payer_account_no",
                      "payer_bank_code",
                      // "payer_virtual_payment_address",
                    ],
                  },
                  settlement_reason_code: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                  message: {
                    type: "object",
                    properties: {
                      name: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                      code: { type: "string", minLength: 1, pattern: "^(?!\\s*$).+" },
                    },
                    errorMessage: {
                      properties: {
                        name: "message > name should be valid and must not be empty.",
                        code: "message > code should be valid and must not be empty.",
                      },
                    },
                    required: ["name", "code"],
                  },
                  created_at: { type: "string",  },
                  updated_at: { type: "string",  },
                },
                errorMessage: {
                  properties: {
                    id: "items > id should be valid and must not be empty.",
                    invoice_no: "items > invoice_no should be valid and must not be empty.",
                    collector_app_id: "items > collector_app_id should be valid and must not be empty.",
                    receiver_app_id: "items > receiver_app_id should be valid and must not be empty.",
                    receiver_app_uri: "items > receiver_app_uri should be valid and must not be empty.",
                    state: "items > state should be valid and must not be empty.",
                    settlement_reason_code: "items > settlement_reason_code should be valid and must not be empty.",
                  },
                },
                required: [
                  "id",
                  // "invoice_no",
                  "collector_app_id",
                  "receiver_app_id",
                  "receiver_app_uri",
                  "state",
                  "provider",
                  "payment",
                  "withholding_tax_gst",
                  "withholding_tax_tds",
                  "deduction_by_collector",
                  "payerdetails",
                  "settlement_reason_code",
                  "created_at",
                  "updated_at",
                ],
              },
            },
          },
          required: ["orders"],
        },
      },
      required: ["orderbook"],
    },
  },
  required: ["context", "message"],
}

export default collectorReconSchema
