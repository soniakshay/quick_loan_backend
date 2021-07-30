const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    user_id: {
        type: String
    },
    payment_details: {
        razorpay_payment_id: {
            type: String
        },
        razorpay_order_id: {
            type: String
        },
        razorpay_signature: {
            type: String
        }
    },
    pay_date: {
        type: String
    },
    amount: {
        type: String,
        default: '199'
    }
});

const Transaction = mongoose.model('transaction', transactionSchema);

module.exports = { Transaction }