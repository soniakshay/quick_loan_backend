const response = (res, status, data) => {
    return res.status(status).json({ data })
}

const createResponse = (data) => {
    return [{ msg: [{msg: data}] }]
}

module.exports = {
    response, createResponse
}