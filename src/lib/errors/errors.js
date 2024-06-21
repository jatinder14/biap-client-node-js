const ERRORS = {
    UNAUTHENTICATED_ERROR: {
        status: 401,
        name: 'UNAUTHENTICATED_ERROR',
        message: 'Authentication failed or session expired'
    },
    UNAUTHORISED_ERROR: {
        status: 403,
        name: 'UNAUTHORISED_ERROR',
        message: 'Access to this resource is unauthorized'
    },
    NO_RECORD_FOUND_ERROR: {
        status: 404,
        name: 'NO_RECORD_FOUND_ERROR',
        message: 'The requested record was not found'
    },
    DUPLICATE_RECORD_FOUND_ERROR: {
        status: 400,
        name: 'DUPLICATE_RECORD_FOUND_ERROR',
        message: 'A duplicate record already exists'
    },
    BAD_REQUEST_PARAMETER_ERROR: {
        status: 400,
        name: 'BAD_REQUEST_PARAMETER_ERROR',
        message: 'Invalid or missing request parameter'
    },
    CONFLICT_ERROR: {
        status: 409,
        name: 'CONFLICT_ERROR',
        message: 'Resource state conflict detected'
    },
    PRECONDITION_REQUIRED_ERROR: {
        status: 428,
        name: 'PRECONDITION_REQUIRED_ERROR',
        message: 'Precondition failed: Required conditions not met'
    },
    INTERNAL_SERVER_ERROR: {
        status: 500,
        name: 'INTERNAL_SERVER_ERROR',
        message: 'We encountered an unexpected error while processing your request, Please try again later.'
    }
}

export default ERRORS;