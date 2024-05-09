
import Ajv from "ajv";
import onCollectonschema from "../rsp_schema/on_collector_recon.js"; // Provide the correct path to your schema file

import { onCollectorRecon } from"../rsp_service/onCollectorRecon.js"

const ajv = new Ajv();

export const onCollectorReconController = {
  onCollectorRecon: async (req,res) => {
    console.log(`Called - onCollectorResponse: ${JSON.stringify(req.body)}`)

    const valid = ajv.validate(onCollectonschema, req.body);
    if (!valid) {
      console.log('Request body does not match the schema:', ajv.errors);
      res.header("Access-Control-Allow-Origin", "*");
      return res.status(400).json({ error: 'Request body does not match the schema' });
    }

    try{
      await onCollectorRecon(req.body)
      return res.send({
        "message": {
        "ack": {
        "status": "ACK"
        }
        },
        }
        ); // Or whatever response you want to send

    }
    catch(error){
      console.error("Error processing request:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    
  },
}

