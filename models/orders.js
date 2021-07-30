const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    user_id: {
        type: String
    },
    loan_type: {
        type: String,
        enum: ['50000', '100000', '150000', '200000', '500000']
    },
    date: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approved_date: {
        type: String
    },
    user_details: {
        type: Object
    },
    approval_amount: {
        type: Number
    },
    aadhar_1: {
        type: String
    },
    aadhar_2: {
        type: String
    },
    pan: {
        type: String
    },
    contacts: [
        {
            name: {
                type: String
            },
            phone: {
                type: String
            },
            relation: {
                type: String
            }
        }
    ],
    profile_pic: {
        type: String
    },
    order_placed: {
        type: Boolean,
        default: false
    },
    paid: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Order = mongoose.model('order', orderSchema);

module.exports = {
    Order
}