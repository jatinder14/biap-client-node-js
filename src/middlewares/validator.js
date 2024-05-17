import Ajv from "ajv";
import addFormats from "ajv-formats"
import addErrors from "ajv-errors"

export const ajv_validate = (req, schema, source) => {
    const ajv = new Ajv({
        allErrors: true,
        strict: "log",
    })
    addFormats(ajv)
    addErrors(ajv)
    const validate = ajv.compile(schema)
    return { valid: validate(req[source]), validate }
}