const ERRORS = {
    UNAUTHENTICATED_ERROR: {
        status: 401,
        name: 'UNAUTHENTICATED_ERROR',
        message: 'You are not authenticated to access this resource, Please log in and try again.'
    },
    UNAUTHORISED_ERROR: {
        status: 403,
        name: 'UNAUTHORISED_ERROR',
        message: 'You do not have the necessary permissions, Access to this resource is denied.'
    },
    NO_RECORD_FOUND_ERROR: {
        status: 404,
        name: 'NO_RECORD_FOUND_ERROR',
        message: 'The requested record could not be found, Please check the request and try again'
    },
    DUPLICATE_RECORD_FOUND_ERROR: {
        status: 400,
        name: 'DUPLICATE_RECORD_FOUND_ERROR',
        message: 'A record with the same information already exists, Duplicate entries are not allowed.'
    },
    BAD_REQUEST_PARAMETER_ERROR: {
        status: 400,
        name: 'BAD_REQUEST_PARAMETER_ERROR',
        message: 'The request parameters are incorrect, Please verify and resubmit your request.'
    },
    CONFLICT_ERROR: {
        status: 409,
        name: 'CONFLICT_ERROR',
        message: 'There is a conflict with the current state of the resource, Please resolve the conflict and try again.'
    },
    PRECONDITION_REQUIRED_ERROR: {
        status: 428,
        name: 'PRECONDITION_REQUIRED_ERROR',
        message: 'A required precondition is missing, Ensure all preconditions are met and try again.'
    },
    INTERNAL_SERVER_ERROR: {
        status: 500,
        name: 'INTERNAL_SERVER_ERROR',
        message: 'We encountered an unexpected error while processing your request, Please try again later.'
    }
}

export default ERRORS;