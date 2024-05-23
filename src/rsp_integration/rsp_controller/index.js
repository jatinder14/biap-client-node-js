
import onCollectonschema from "../rsp_schema/on_collector_recon.js";
import onPrepareschema from "../rsp_schema/on_prepare_recon.js";
import { onCollectorRecon } from "../rsp_service/onCollectorRecon.js"
import { onPrepareRecon } from "../rsp_service/onPrepareRecon.js"
import { ajv_validate } from "../../middlewares/validator.js";

export const onCollectorReconController = {

  onCollectorRecon: async (req, res) => {
    console.log(`Called - onCollectorResponse: ${JSON.stringify(req.body)}`)
    const { valid, validate } = ajv_validate({ body: req.body }, onCollectonschema, "body")

    if (!valid) {
      const errors = validate.errors?.map(error => ({
        message: error?.message,
        dataPath: error.schemaPath,
      })) || []

      res.header("Access-Control-Allow-Origin", "*");
      return res.status(400).json({ success: false, message: 'Request body does not match the schema', error: errors });
    }

    try {
      await onCollectorRecon(req.body)
      return res.send({
        "message": {
          "ack": {
            "status": "ACK"
          }
        },
      });

    }
    catch (error) {
      console.error("Error processing onCollectorRecon request:", error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  onPrepareRecon: async (req, res) => {
    console.log(`Called - onPrepareRecon: ${JSON.stringify(req.body)}`)

    const { valid, validate } = ajv_validate({ body: req.body }, onPrepareschema, "body")

    if (!valid) {
      const errors = validate.errors?.map(error => ({
        message: error?.message,
        dataPath: error.schemaPath,
      })) || []

      res.header("Access-Control-Allow-Origin", "*");
      return res.status(400).json({ success: false, message: 'Request body does not match the schema', error: errors });
    }

    try {
      await onPrepareRecon(req.body)
      return res.send({
        "message": {
          "ack": {
            "status": "ACK"
          }
        },
      });

    }
    catch (error) {
      console.error("Error processing onPrepareRecon request:", error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
}

