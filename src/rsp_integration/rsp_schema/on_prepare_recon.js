const schema = {
  type: "object",
  properties: {
    recon_id: { type: "string", format: "email" },
    status: { type: "boolean" },
    collector_recon: { type: "object" },
  },
  errorMessage: {
    properties: {
      recon_id: "recon_id should be valid, current value is ${/recon_id}",
      status: "status should be valid, current value is ${/status}",
      collector_recon: "collector_recon should be valid, current value is ${/collector_recon}",
    },
  },
  required: ["recon_id", "collector_recon"],
}

export default schema
