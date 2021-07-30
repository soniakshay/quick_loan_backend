const { validationResult } = require('express-validator');
const { response, createResponse } = require('./response');

const validationCheck = (req, res, next) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return response(res, 400, [{ msg: errors }])
        } else {
            next();
        }
    } catch (error) {
        console.log(error, 'Error in validation check !');
        return response(res, 400, createResponse('Error in validation check !'))
    }
}

module.exports = {
    validationCheck
}