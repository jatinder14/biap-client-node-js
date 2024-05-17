const schema = {
    type: "object",
    properties: {
        orders: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    transaction_details: {
                        type: "object",
                        properties: {
                            collector: {
                                type: "object",
                                properties: {
                                    id: { type: "string", errorMessage: "Collector ID is required" },
                                    url: { type: "string", errorMessage: "Collector URL is required" },
                                },
                                required: ["id", "url"],
                            },
                            receiver: {
                                type: "object",
                                properties: {
                                    id: { type: "string", errorMessage: "Receiver ID is required" },
                                    url: { type: "string", errorMessage: "Receiver URL is required" },
                                },
                                required: ["id", "url"],
                            },
                            payment_gateway: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        reference_id: { type: "string", errorMessage: "Reference ID is required" },
                                        status: { type: "string", errorMessage: "Status is required" },
                                        payment_date: {
                                            type: "string",
                                            format: "date-time",
                                            errorMessage: "Payment date is required and must be a valid date-time",
                                        },
                                        invoice_pdf_url: {
                                            type: "string",
                                            format: "uri",
                                            errorMessage: "Invoice PDF URL is required and must be a valid URI",
                                        },
                                        collection_method: { type: "string", errorMessage: "Collection method is required" },
                                    },
                                    required: ["reference_id", "status", "payment_date", "invoice_pdf_url", "collection_method"],
                                },
                            },
                            network: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        payment_reference_id: { type: "string", errorMessage: "Payment reference ID is required" },
                                        latest_on_action: {
                                            type: "object",
                                            properties: {
                                                context: {
                                                    type: "object",
                                                    properties: {
                                                        domain: { type: "string", errorMessage: "Domain is required" },
                                                        action: { type: "string", errorMessage: "Action is required" },
                                                        core_version: { type: "string", errorMessage: "Core version is required" },
                                                        bap_id: { type: "string", errorMessage: "BAP ID is required" },
                                                        bap_uri: {
                                                            type: "string",
                                                            format: "uri",
                                                            errorMessage: "BAP URI is required and must be a valid URI",
                                                        },
                                                        bpp_id: { type: "string", errorMessage: "BPP ID is required" },
                                                        bpp_uri: {
                                                            type: "string",
                                                            format: "uri",
                                                            errorMessage: "BPP URI is required and must be a valid URI",
                                                        },
                                                        transaction_id: { type: "string", errorMessage: "Transaction ID is required" },
                                                        message_id: { type: "string", errorMessage: "Message ID is required" },
                                                        country: { type: "string", errorMessage: "Country is required" },
                                                        city: { type: "string", errorMessage: "City is required" },
                                                        timestamp: {
                                                            type: "string",
                                                            format: "date-time",
                                                            errorMessage: "Timestamp is required and must be a valid date-time",
                                                        },
                                                        ttl: { type: "string", errorMessage: "TTL is required" },
                                                    },
                                                    required: [
                                                        "domain",
                                                        "action",
                                                        "core_version",
                                                        "bap_id",
                                                        "bap_uri",
                                                        "bpp_id",
                                                        "bpp_uri",
                                                        "transaction_id",
                                                        "message_id",
                                                        "country",
                                                        "city",
                                                        "timestamp",
                                                        "ttl",
                                                    ],
                                                },
                                                message: {
                                                    type: "object",
                                                    properties: {
                                                        order: {
                                                            type: "object",
                                                            properties: {
                                                                id: { type: "string", errorMessage: "Order ID is required" },
                                                                state: { type: "string", errorMessage: "Order state is required" },
                                                                provider: {
                                                                    type: "object",
                                                                    properties: {
                                                                        id: { type: "string", errorMessage: "Provider ID is required" },
                                                                        rateable: { type: "boolean", errorMessage: "Rateable is required" },
                                                                        locations: {
                                                                            type: "array",
                                                                            items: {
                                                                                type: "object",
                                                                                properties: {
                                                                                    id: { type: "string", errorMessage: "Location ID is required" },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                    required: ["id", "locations"],
                                                                },
                                                                items: {
                                                                    type: "array",
                                                                    items: {
                                                                        type: "object",
                                                                        properties: {
                                                                            id: { type: "string", errorMessage: "Item ID is required" },
                                                                            quantity: {
                                                                                type: "object",
                                                                                properties: {
                                                                                    count: { type: "integer", errorMessage: "Quantity count is required" },
                                                                                },
                                                                                required: ["count"],
                                                                            },
                                                                            fulfillment_id: { type: "string", errorMessage: "Fulfillment ID is required" },
                                                                        },
                                                                        required: ["id", "quantity", "fulfillment_id"],
                                                                    },
                                                                },
                                                                billing: {
                                                                    type: "object",
                                                                    properties: {
                                                                        name: { type: "string", errorMessage: "Billing name is required" },
                                                                        email: {
                                                                            type: "string",
                                                                            format: "email",
                                                                            errorMessage: "Billing email is required and must be a valid email",
                                                                        },
                                                                        phone: { type: "string", errorMessage: "Billing phone is required" },
                                                                        address: {
                                                                            type: "object",
                                                                            properties: {
                                                                                city: { type: "string", errorMessage: "Billing city is required" },
                                                                                name: { type: "string", errorMessage: "Billing name is required" },
                                                                                state: { type: "string", errorMessage: "Billing state is required" },
                                                                                country: { type: "string", errorMessage: "Billing country is required" },
                                                                                building: { type: "string", errorMessage: "Billing building is required" },
                                                                                locality: { type: "string", errorMessage: "Billing locality is required" },
                                                                                area_code: { type: "string", errorMessage: "Billing area code is required" },
                                                                            },
                                                                        },
                                                                        created_at: {
                                                                            type: "string",
                                                                            format: "date-time",
                                                                            errorMessage: "Billing created at is required and must be a valid date-time",
                                                                        },
                                                                        tax_number: { type: "string", errorMessage: "Billing tax number is required" },
                                                                        updated_at: {
                                                                            type: "string",
                                                                            format: "date-time",
                                                                            errorMessage: "Billing updated at is required and must be a valid date-time",
                                                                        },
                                                                    },
                                                                },
                                                                fulfillments: {
                                                                    type: "array",
                                                                    items: {
                                                                        type: "object",
                                                                        properties: {
                                                                            id: { type: "string", errorMessage: "Fulfillment ID is required" },
                                                                            end: {
                                                                                type: "object",
                                                                                properties: {
                                                                                    time: {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            range: {
                                                                                                type: "object",
                                                                                                properties: {
                                                                                                    end: {
                                                                                                        type: "string",
                                                                                                        format: "date-time",
                                                                                                        errorMessage:
                                                                                                            "Fulfillment end time is required and must be a valid date-time",
                                                                                                    },
                                                                                                    start: {
                                                                                                        type: "string",
                                                                                                        format: "date-time",
                                                                                                        errorMessage:
                                                                                                            "Fulfillment start time is required and must be a valid date-time",
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                    person: {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            name: {
                                                                                                type: "string",
                                                                                                errorMessage: "Fulfillment person name is required",
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                    contact: {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            email: {
                                                                                                type: "string",
                                                                                                format: "email",
                                                                                                errorMessage:
                                                                                                    "Fulfillment contact email is required and must be a valid email",
                                                                                            },
                                                                                            phone: {
                                                                                                type: "string",
                                                                                                errorMessage: "Fulfillment contact phone is required",
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                    location: {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            gps: {
                                                                                                type: "string",
                                                                                                errorMessage: "Fulfillment location GPS is required",
                                                                                            },
                                                                                            address: {
                                                                                                type: "object",
                                                                                                properties: {
                                                                                                    city: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment location city is required",
                                                                                                    },
                                                                                                    name: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment location name is required",
                                                                                                    },
                                                                                                    state: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment location state is required",
                                                                                                    },
                                                                                                    country: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment location country is required",
                                                                                                    },
                                                                                                    building: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment location building is required",
                                                                                                    },
                                                                                                    locality: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment location locality is required",
                                                                                                    },
                                                                                                    area_code: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment location area code is required",
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                            type: { type: "string", errorMessage: "Fulfillment type is required" },
                                                                            start: {
                                                                                type: "object",
                                                                                properties: {
                                                                                    time: {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            range: {
                                                                                                type: "object",
                                                                                                properties: {
                                                                                                    end: {
                                                                                                        type: "string",
                                                                                                        format: "date-time",
                                                                                                        errorMessage:
                                                                                                            "Fulfillment start time is required and must be a valid date-time",
                                                                                                    },
                                                                                                    start: {
                                                                                                        type: "string",
                                                                                                        format: "date-time",
                                                                                                        errorMessage:
                                                                                                            "Fulfillment start time is required and must be a valid date-time",
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                    contact: {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            email: {
                                                                                                type: "string",
                                                                                                format: "email",
                                                                                                errorMessage:
                                                                                                    "Fulfillment start contact email is required and must be a valid email",
                                                                                            },
                                                                                            phone: {
                                                                                                type: "string",
                                                                                                errorMessage: "Fulfillment start contact phone is required",
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                    location: {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            id: {
                                                                                                type: "string",
                                                                                                errorMessage: "Fulfillment start location ID is required",
                                                                                            },
                                                                                            gps: {
                                                                                                type: "string",
                                                                                                errorMessage: "Fulfillment start location GPS is required",
                                                                                            },
                                                                                            address: {
                                                                                                type: "object",
                                                                                                properties: {
                                                                                                    city: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment start location city is required",
                                                                                                    },
                                                                                                    name: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment start location name is required",
                                                                                                    },
                                                                                                    state: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment start location state is required",
                                                                                                    },
                                                                                                    country: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment start location country is required",
                                                                                                    },
                                                                                                    building: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment start location building is required",
                                                                                                    },
                                                                                                    locality: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment start location locality is required",
                                                                                                    },
                                                                                                    area_code: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Fulfillment start location area code is required",
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                            descriptor: {
                                                                                                type: "object",
                                                                                                properties: {
                                                                                                    name: {
                                                                                                        type: "string",
                                                                                                        errorMessage:
                                                                                                            "Fulfillment start location descriptor name is required",
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                            state: {
                                                                                type: "object",
                                                                                properties: {
                                                                                    descriptor: {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            code: {
                                                                                                type: "string",
                                                                                                errorMessage: "Fulfillment state descriptor code is required",
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                            rateable: { type: "boolean", errorMessage: "Fulfillment rateable is required" },
                                                                            tracking: { type: "boolean", errorMessage: "Fulfillment tracking is required" },
                                                                            "@ondc/org/provider_name": {
                                                                                type: "string",
                                                                                errorMessage: "Fulfillment provider name is required",
                                                                            },
                                                                            "@ondc/org/TAT": {
                                                                                type: "string",
                                                                                errorMessage: "Fulfillment TAT is required",
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                quote: {
                                                                    type: "object",
                                                                    properties: {
                                                                        ttl: { type: "string", errorMessage: "Quote TTL is required" },
                                                                        price: {
                                                                            type: "object",
                                                                            properties: {
                                                                                value: { type: "string", errorMessage: "Quote price value is required" },
                                                                                currency: {
                                                                                    type: "string",
                                                                                    errorMessage: "Quote price currency is required",
                                                                                },
                                                                            },
                                                                            required: ["value", "currency"],
                                                                        },
                                                                        breakup: {
                                                                            type: "array",
                                                                            items: {
                                                                                type: "object",
                                                                                properties: {
                                                                                    item: {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            price: {
                                                                                                type: "object",
                                                                                                properties: {
                                                                                                    value: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Item price value is required",
                                                                                                    },
                                                                                                    currency: {
                                                                                                        type: "string",
                                                                                                        errorMessage: "Item price currency is required",
                                                                                                    },
                                                                                                },
                                                                                                required: ["value", "currency"],
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                    price: {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            value: {
                                                                                                type: "string",
                                                                                                errorMessage: "Breakup price value is required",
                                                                                            },
                                                                                            currency: {
                                                                                                type: "string",
                                                                                                errorMessage: "Breakup price currency is required",
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                    title: { type: "string", errorMessage: "Breakup title is required" },
                                                                                    "@ondc/org/item_id": {
                                                                                        type: "string",
                                                                                        errorMessage: "Breakup item ID is required",
                                                                                    },
                                                                                    "@ondc/org/title_type": {
                                                                                        type: "string",
                                                                                        errorMessage: "Breakup title type is required",
                                                                                    },
                                                                                    "@ondc/org/item_quantity": {
                                                                                        type: "object",
                                                                                        properties: {
                                                                                            count: {
                                                                                                type: "integer",
                                                                                                errorMessage: "Breakup item quantity count is required",
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                    required: ["ttl", "price", "breakup"],
                                                                },
                                                                payment: {
                                                                    type: "object",
                                                                    properties: {
                                                                        uri: {
                                                                            type: "string",
                                                                            format: "uri",
                                                                            errorMessage: "Payment URI is required and must be a valid URI",
                                                                        },
                                                                        tl_method: {
                                                                            type: "string",
                                                                            errorMessage: "Payment transaction method is required",
                                                                        },
                                                                        type: { type: "string", errorMessage: "Payment type is required" },
                                                                        params: {
                                                                            type: "object",
                                                                            properties: {
                                                                                transaction_status: {
                                                                                    type: "string",
                                                                                    errorMessage: "Payment transaction status is required",
                                                                                },
                                                                                transaction_id: {
                                                                                    type: "string",
                                                                                    errorMessage: "Payment transaction ID is required",
                                                                                },
                                                                                amount: { type: "string", errorMessage: "Payment amount is required" },
                                                                                currency: { type: "string", errorMessage: "Payment currency is required" },
                                                                            },
                                                                            required: ["amount", "currency"],
                                                                        },
                                                                        status: { type: "string", errorMessage: "Payment status is required" },
                                                                        collected_by: {
                                                                            type: "string",
                                                                            errorMessage: "Payment collected by is required",
                                                                        },
                                                                        "@ondc/org/settlement_basis": {
                                                                            type: "string",
                                                                        },
                                                                        "@ondc/org/settlement_window": {
                                                                            type: "string",
                                                                        },
                                                                        "@ondc/org/settlement_details": {
                                                                            type: "array",
                                                                            items: {
                                                                                type: "object",
                                                                                properties: {
                                                                                    settlement_counterparty: {
                                                                                        type: "string",
                                                                                        errorMessage: "Payment settlement counterparty is required",
                                                                                    },
                                                                                    settlement_phase: {
                                                                                        type: "string",
                                                                                        errorMessage: "Payment settlement phase is required",
                                                                                    },
                                                                                    settlement_amount: {
                                                                                        type: "number",
                                                                                        errorMessage: "Payment settlement amount is required",
                                                                                    },
                                                                                    settlement_type: {
                                                                                        type: "string",
                                                                                        errorMessage: "Payment settlement type is required",
                                                                                    },
                                                                                    settlement_bank_account_no: {
                                                                                        type: "string",
                                                                                        errorMessage: "Payment settlement bank account number is required",
                                                                                    },
                                                                                    settlement_ifsc_code: {
                                                                                        type: "string",
                                                                                        errorMessage: "Payment settlement IFSC code is required",
                                                                                    },
                                                                                    bank_name: {
                                                                                        type: "string",
                                                                                        errorMessage: "Payment bank name is required",
                                                                                    },
                                                                                    branch_name: {
                                                                                        type: "string",
                                                                                        errorMessage: "Payment branch name is required",
                                                                                    },
                                                                                    beneficiary_name: {
                                                                                        type: "string",
                                                                                        errorMessage: "Payment beneficiary name is required",
                                                                                    },
                                                                                    beneficiary_address: {
                                                                                        type: "string",
                                                                                        errorMessage: "Payment beneficiary address is required",
                                                                                    },
                                                                                    settlement_status: {
                                                                                        type: "string",
                                                                                        errorMessage: "Payment settlement status is required",
                                                                                    },
                                                                                },
                                                                                required: [
                                                                                    "settlement_amount",
                                                                                    "settlement_phase",
                                                                                    "settlement_type",
                                                                                    "beneficiary_name",
                                                                                    "beneficiary_address",
                                                                                    "settlement_status",
                                                                                ],
                                                                            },
                                                                        },
                                                                        "@ondc/org/withholding_amount": {
                                                                            type: "string",
                                                                        },
                                                                        "@ondc/org/buyer_app_finder_fee_type": {
                                                                            type: "string",
                                                                            errorMessage: "Payment buyer app finder fee type is required",
                                                                        },
                                                                        "@ondc/org/buyer_app_finder_fee_amount": {
                                                                            type: "string",
                                                                            errorMessage: "Payment buyer app finder fee amount is required",
                                                                        },
                                                                    },
                                                                    required: [
                                                                        // need to check
                                                                        "type",
                                                                        "params",
                                                                        "status",
                                                                        "collected_by",
                                                                        // "@ondc/org/settlement_basis",
                                                                        // "@ondc/org/settlement_window",
                                                                        "@ondc/org/settlement_details",
                                                                        // "@ondc/org/withholding_amount",
                                                                        "@ondc/org/buyer_app_finder_fee_type",
                                                                        "@ondc/org/buyer_app_finder_fee_amount",
                                                                    ],
                                                                },
                                                                documents: {
                                                                    type: "array",
                                                                    items: {
                                                                        type: "object",
                                                                        properties: {
                                                                            url: {
                                                                                type: "string",
                                                                                format: "uri",
                                                                                errorMessage: "Document URL is required and must be a valid URI",
                                                                            },
                                                                            label: { type: "string", errorMessage: "Document label is required" },
                                                                        },
                                                                    },
                                                                },
                                                                created_at: {
                                                                    type: "string",
                                                                    format: "date-time",
                                                                    errorMessage: "Created at is required and must be a valid date-time",
                                                                },
                                                                updated_at: {
                                                                    type: "string",
                                                                    format: "date-time",
                                                                    errorMessage: "Updated at is required and must be a valid date-time",
                                                                },
                                                            },
                                                            required: ["id", "state", "provider", "quote", "payment", "created_at", "updated_at"],
                                                        },
                                                    },
                                                    required: ["order"],
                                                },
                                            },
                                            required: ["context", "message"],
                                        },
                                    },
                                    required: ["payment_reference_id", "latest_on_action"],
                                },
                            },
                        },
                        required: ["collector", "receiver", "payment_gateway", "network"],
                    },
                },
                required: ["transaction_details"],
            },
        },
    },
    required: ["orders"],
}

export default schema