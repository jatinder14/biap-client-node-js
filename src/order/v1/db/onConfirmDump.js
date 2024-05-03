import mongoose from 'mongoose';

const { Schema } = mongoose;

const LocationSchema = new Schema({
  id: String,
  descriptor: {
    name: String
  },
  gps: String,
  address: {
    name: String,
    building: String,
    locality: String,
    city: String,
    state: String,
    country: String,
    areaCode: String
  },
  emailSendToSeller:{
    type:Boolean
  }

});

const ContactSchema = new Schema({
  phone: String,  
  email: String
});

const ItemSchema = new Schema({
  id: String,
  fulfillment_id: String,
  quantity: {
    count: Number
  }
});

const PriceSchema = new Schema({
  currency: String,
  value: String
});

const TagListSchema = new Schema({
  code: String,
  value: String
});

const TagSchema = new Schema({
  code: String,
  list: [TagListSchema]
});

const PaymentParamsSchema = new Schema({
  currency: String,
  transaction_id: String,
  amount: String
});

const SettlementDetailsSchema = new Schema({
  settlement_counterparty: String,
  settlement_phase: String,
  settlement_type: String,
  upi_address: String,
  settlement_bank_account_no: String,
  settlement_ifsc_code: String,
  beneficiary_name: String,
  bank_name: String,
  branch_name: String
});

const FulfillmentSchema = new Schema({
  id: String,
  "@ondc/org/provider_name": String,
  state: {
    descriptor: {
      code: String
    }
  },
  type: String,
  tracking: Boolean,
  "@ondc/org/TAT": String,
  start: {
    location: LocationSchema,
    contact: ContactSchema
  },
  end: {
    location: LocationSchema,
    person: {
      name: String
    },
    contact: ContactSchema
  },
  tags: [String]
});

const DocumentSchema = new Schema({
  url: String,
  label: String
});

const CancellationTermSchema = new Schema({
  fulfillment_state: {
    descriptor: {
      code: String,
      short_desc: String
    }
  },
  refund_eligible: Boolean,
  reason_required: Boolean,
  cancellation_fee: {
    amount: {
      currency: String,
      value: String
    }
  }
});

const OrderSchema = new Schema({
  context: {
    domain: String,
    country: String,
    city: String,
    action: String,
    core_version: String,
    bap_id: String,
    bap_uri: String,
    bpp_uri: String,
    transaction_id: String,
    message_id: String,
    timestamp: Date,
    bpp_id: String,
    ttl: String
  },
  message: {
    order: {
      updated_at: Date,
      created_at: Date,
      id: String,
      state: String,
      provider: {
        id: String,
        locations: [LocationSchema]
      },
      items: [ItemSchema],
      billing: {
        name: String,
        address: {
          name: String,
          building: String,
          locality: String,
          city: String,
          state: String,
          country: String,
          areaCode: String
        },
        email: String,
        phone: String,
        created_at: Date,
        updated_at: Date
      },
      fulfillments: [FulfillmentSchema],
      quote: {
        price: PriceSchema,
        breakup: [
          {
            "@ondc/org/item_id": String,
            "@ondc/org/item_quantity": {
              count: Number
            },
            title: String,
            "@ondc/org/title_type": String,
            price: PriceSchema,
            item: {
              price: PriceSchema,
              tags: [TagSchema]
            }
          }
        ],
        ttl: String
      },
      payment: {
        params: PaymentParamsSchema,
        status: String,
        type: String,
        collected_by: String,
        "@ondc/org/buyer_app_finder_fee_type": String,
        "@ondc/org/buyer_app_finder_fee_amount": String,
        "@ondc/org/settlement_details": [SettlementDetailsSchema]
      },
      documents: [DocumentSchema],
      cancellation_terms: [CancellationTermSchema],
      tags: [TagSchema]
    },
    created_at: Date,
    updated_at: Date
  }
});

const OnConfirmData = mongoose.model('OnConfirmData', OrderSchema);

export default OnConfirmData;
