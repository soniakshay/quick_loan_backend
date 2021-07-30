const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    registration_type: {
        type: String,
        enum: ['google', 'fb', 'otp']
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    profile_status: {
        type: String,
        enum: ['first', 'second', 'completed'],
        default: 'first'
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
    profile_pic: {
        type: String
    },
    verified: {
        type: Boolean,
        default: true
    },
    dob: {
        type: String
    },
    gender: {
        type: String,
        enum: ['male', 'female']
    },
    paid: {
        type: Boolean,
        default: false
    },
    employment_type: {
        type: String,
        enum: ['salary', 'self_employed']
    },
    income: {
        type: String
    },
    pincode: {
        type: String
    },
    pay_date: {
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
    profession: {
        type: String
    },
    last_otp_request: {
        type: Number
    },
    otp_count: {
        type: Number,
        default: 1
    },
    marital_status: {
        type: String,
        enum: ['married', 'unmarried'],
        default: 'unmarried'
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    current_emi: {
        type: Boolean,
        default: false
    },
    current_emi_amount: {
        type: Number,
        default: 0
    },
    required_loan_amount: {
        type: Number
    },
    household_liabilities: {
        type: Number
    },
    pan_card_number: {
        type: String
    },
    last_order: {
        type: Number
    },
    address: {
        type: String
    }
});


const User = mongoose.model('user', userSchema);
module.exports = { User }