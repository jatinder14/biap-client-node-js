import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
// import { searchSchema } from "../validation/RET/search"
// import { cancelSchema } from "../validation/RET/cancel"
// import { onCancelSchema } from "../validation/RET/on_cancel"
// import { statusSchema } from "../validation/RET/status"
// import { onStatusSchema } from "../validation/RET/on_status"
// import { FnBonSearchIncSchema } from "../validation/RET/on_search_inc"
// import { onSearchSchema } from "../validation/RET/on_search"
// import { selectSchema } from "../validation/RET/select"
// import { onSelectSchema } from "../validation/RET/on_select"
// import { initSchema } from "../validation/RET/init"
// import { onInitSchema } from "../validation/RET/on_init"
// import { confirmSchema } from "../validation/RET/confirm"
// import { onConfirmSchema } from "../validation/RET/on_confirm"
import  collectorReconSchema  from "../rsp_integration/rsp_schema/collector_recon.js"
// import { onCollectorReconSchema } from "../validation/NTS/on_collector_recon"
// import { receiverReconSchema } from "../validation/NTS/receiver_recon"
// import { onReceiverReconSchema } from "../validation/NTS/on_receiver_recon"
 

const ajv = new Ajv({ allErrors: true });
ajvErrors(ajv); // Pass the Ajv instance to ajvErrors

const formatted_error = (errors) => {
  const error_list = []
  let status = ""
  errors.forEach((error) => {
    if (!["not", "oneOf", "anyOf", "allOf", "if", "then", "else"].includes(error.keyword)) {
      const error_dict = {
        message: `${error.message}${error.params.allowedValues ? ` (${error.params.allowedValues})` : ""}${
          error.params.allowedValue ? ` (${error.params.allowedValue})` : ""
        }${error.params.additionalProperty ? ` (${error.params.additionalProperty})` : ""}`,
        details: error.instancePath,
      }
      error_list.push(error_dict)
    }
  })
  if (error_list.length === 0) status = "pass"
  else status = "fail"
  const error_json = { errors: error_list, status: status }
  return error_json
}
 
export const validate_schema = (data, schema) => {
  console.log("46",data)
  console.log("47",schema)

  let error_list = []
 
  const validate = ajv.compile(schema)
  const valid = validate(data)
  if (!valid) {
    console.log("51>>>>>>>>>>>>>>")
    error_list = validate.errors
  }
  console.log("54>>>>>>>>>>>>>>")

  return error_list
}
 
// // search
 
// const validate_schema_search_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, searchSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_search_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, searchSchema)
//   return formatted_error(error_list)
// }
 
// // On search
 
// const validate_schema_on_search_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, onSearchSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_on_search_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, onSearchSchema)
//   return formatted_error(error_list)
// }
 
// // On search Inc
 
// const validate_schema_on_search_inc_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, FnBonSearchIncSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_on_search_inc_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, FnBonSearchIncSchema)
//   return formatted_error(error_list)
// }
 
// // select
// const validate_schema_select_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, selectSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_select_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, selectSchema)
//   return formatted_error(error_list)
// }
 
// // On select
// const validate_schema_on_select_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, onSelectSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_on_select_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, onSelectSchema)
//   return formatted_error(error_list)
// }
 
// // init
 
// const validate_schema_init_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, initSchema)
//   return formatted_error(error_list)
// }
// const validate_schema_init_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, initSchema)
//   return formatted_error(error_list)
// }
 
// // On init
 
// const validate_schema_on_init_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, onInitSchema)
//   return formatted_error(error_list)
// }
// const validate_schema_on_init_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, onInitSchema)
//   return formatted_error(error_list)
// }
 
// // confirm
 
// const validate_schema_confirm_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, confirmSchema)
//   return formatted_error(error_list)
// }
// const validate_schema_confirm_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, confirmSchema)
//   return formatted_error(error_list)
// }
 
// // On confirm
 
// const validate_schema_on_confirm_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, onConfirmSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_on_confirm_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, onConfirmSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_cancel_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, cancelSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_cancel_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, cancelSchema)
//   return formatted_error(error_list)
// }
// const validate_schema_on_cancel_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, onCancelSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_on_cancel_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, onCancelSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_status_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, statusSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_status_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, statusSchema)
//   return formatted_error(error_list)
// }
// const validate_schema_on_status_RET12_for_json = (data) => {
//   const error_list = validate_schema(data, onStatusSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_on_status_RET18_for_json = (data) => {
//   const error_list = validate_schema(data, onStatusSchema)
//   return formatted_error(error_list)
// }√
 
// const validate_schema_receiver_recon_NTS10_for_json = (data) => {
//   const error_list = validate_schema(data, receiverReconSchema)
//   return formatted_error(error_list)
// }
 
// const validate_schema_on_receiver_recon_NTS10_for_json = (data) => {
//   const error_list = validate_schema(data, onReceiverReconSchema)
//   return formatted_error(error_list)
// }
 
export const validate_schema_collector_recon_NTS10_for_json = (data) => {
  const error_list = validate_schema(data, collectorReconSchema)
  return formatted_error(error_list)
}
 
// const validate_schema_on_collector_recon_NTS10_for_json = (data) => {
//   const error_list = validate_schema(data, onCollectorReconSchema)
//   return formatted_error(error_list)
// }
 
//  export default  validate_schema_collector_recon_NTS10_for_json

//   validate_schema_search_RET12_for_json,
//   validate_schema_search_RET18_for_json,
//   validate_schema_on_search_RET12_for_json,
//   validate_schema_on_search_RET18_for_json,
//   validate_schema_select_RET12_for_json,
//   validate_schema_select_RET18_for_json,
//   validate_schema_on_select_RET12_for_json,
//   validate_schema_on_select_RET18_for_json,
//   validate_schema_init_RET12_for_json,
//   validate_schema_init_RET18_for_json,
//   validate_schema_on_init_RET12_for_json,
//   validate_schema_on_init_RET18_for_json,
//   validate_schema_on_search_inc_RET12_for_json,
//   validate_schema_on_search_inc_RET18_for_json,
//   validate_schema_confirm_RET12_for_json,
//   validate_schema_confirm_RET18_for_json,
//   validate_schema_on_confirm_RET12_for_json,
//   validate_schema_on_confirm_RET18_for_json,
//   validate_schema_status_RET12_for_json,
//   validate_schema_status_RET18_for_json,
//   validate_schema_on_status_RET12_for_json,
//   validate_schema_on_status_RET18_for_json,
//   validate_schema_cancel_RET12_for_json,
//   validate_schema_cancel_RET18_for_json,
//   validate_schema_on_cancel_RET12_for_json,
//   validate_schema_on_cancel_RET18_for_json,
//   validate_schema_receiver_recon_NTS10_for_json,
//   validate_schema_on_receiver_recon_NTS10_for_json,
//   validate_schema_on_collector_recon_NTS10_for_json,
