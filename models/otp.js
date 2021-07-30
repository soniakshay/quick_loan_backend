const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    phone: {
        type: String
    },
    otp_count: {
        type: Number,
        default: 1
    },
    last_sent: {
        type: Number
    }
});

const Otp = mongoose.model('otp', otpSchema);

module.exports = {
    Otp
}