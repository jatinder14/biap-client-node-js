
import onCollectonschema from "../rsp_schema/on_collector_recon.js";
import onPrepareschema from "../rsp_schema/on_prepare_recon.js";
import receiverReconSchema from "../rsp_schema/receiver_recon.js";
import { onCollectorRecon } from "../rsp_service/onCollectorRecon.js"
import { onPrepareRecon } from "../rsp_service/onPrepareRecon.js"
import { receiverRecon } from "../rsp_service/receiverRecon.js"
import { ajv_validate } from "../../middlewares/validator.js";
import logger from "../../utils/logger.js";


export const rspController = {

  /**
   * INFO: Handle on collector recon
   * @param {*} req 
   * @param {*} res 
   * @returns 
   */
  onCollectorRecon: async (req, res) => {
    logger.info(`Called - onCollectorResponse: ====* ${JSON.stringify(req.body)}`);
    const { valid, validate } = ajv_validate({ body: req.body }, onCollectonschema, "body")

    if (!valid) {
      const errors = validate.errors?.map(error => ({
        message: error?.message,
        dataPath: error.schemaPath,
      })) || []

      console.log("onCollectorRecon errors ---------", errors);
      res.header("Access-Control-Allow-Origin", "*");
      return res.status(400).json({
        context: req.body.context,
        message: {
          ack: {
            status: "NACK",
          },
        },
        error: errors
      });
    }

    try {
      await onCollectorRecon(req.body)
      return res.send({
        context: req.body.context,
        message: {
          ack: {
            status: "ACK"
          }
        },
      });

    }
    catch (error) {
      console.error("Error processing onCollectorRecon request:", error);
      return res.status(500).json({
        context: req.body.context,
        message: {
          ack: {
            status: "NACK",
          },
        },
      });
    }
  },

  /**
   * INFO: Handle on prepare recon
   * @param {*} req 
   * @param {*} res 
   * @returns 
   */
  onPrepareRecon: async (req, res) => {
    logger.info(`Called - onPrepareRecon: ====* ${JSON.stringify(req.body)}`);
    const { valid, validate } = ajv_validate({ body: req.body }, onPrepareschema, "body")

    if (!valid) {
      const errors = validate.errors?.map(error => ({
        message: error?.message,
        dataPath: error.schemaPath,
      })) || []
      console.log("onPrepareRecon errors ---------", errors);
      res.header("Access-Control-Allow-Origin", "*");
      return res.status(400).json({
        message: {
          ack: {
            status: "NACK",
          },
        },
        error: errors
      });
    }

    try {
      await onPrepareRecon(req.body)
      return res.send({
        message: {
          ack: {
            status: "ACK"
          }
        },
      });

    }
    catch (error) {
      console.error("Error processing onPrepareRecon request:", error);
      return res.status(500).json({
        message: {
          ack: {
            status: "NACK",
          },
        },
      });
    }
  },

  /**
   * INFO: Handle receiver recon
   * @param {*} req 
   * @param {*} res 
   * @returns 
   */
  receiverRecon: async (req, res) => {
    logger.info(`Called - receiverRecon: ====* ${JSON.stringify(req.body)}`);
    const { valid, validate } = ajv_validate({ body: req.body }, receiverReconSchema, "body")

    if (!valid) {
      const errors = validate.errors?.map(error => ({
        message: error?.message,
        dataPath: error.schemaPath,
      })) || []

      console.log("receiverRecon errors ---------", errors);
      res.header("Access-Control-Allow-Origin", "*");
      return res.status(400).json({
        message: {
          ack: {
            status: "NACK",
          },
        },
        error: errors
      });
    }

    try {
      await receiverRecon(req.body)
      return res.send({
        context: req.body.context,
        message: {
          ack: {
            status: "ACK"
          }
        },
      });

    }
    catch (error) {
      console.error("Error processing onPrepareRecon request:", error);
      return res.status(500).json({
        context: req.body.context,
        message: {
          ack: {
            status: "NACK",
          },
        },
      });
    }
  },
}

