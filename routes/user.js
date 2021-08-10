const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require("passport");
const { createToken, verify, verifyAdmin, decodeToken } = require('../config/jwt');
const { response, createResponse } = require('../config/response');
const { User } = require('../models/user');
const { validationCheck } = require('../config/errorCheck');
const axios = require('axios');
const { imageUpload, imageFolder } = require('../config/image');
const Razorpay = require('razorpay');
const { Otp } = require('../models/otp');


const smsAuthKey = '36855AaIxKbYnyv5fe1d661P30', route_no = 6, sender_id = 'QUICLN', sms_url = 'http://fastsms.fastsmsindia.com/api/sendhttp.php';

const sendServerOtp = async(message, phone) => {
    message = message + ' QUICLN';
    // message =  '183076 is your OTP code for Quick Loans and is valid for 15 minutes. Do not share it with anyone. QUICLN';
    // const url =
    //     'http://fastsms.fastsmsindia.com/api/sendhttp.php?authkey=36855AaIxKbYnyv5fe1d661P30&mobiles='+phone+ '&message=' + message +'&sender=QUICLN&route=6&country=91&DLT_TE_ID=1207162495401159900';
    const url = 'http://fastsms.fastsmsindia.com/api/sendhttp.php?authkey=36855AaIxKbYnyv5fe1d661P30&mobiles=8000623262&message='+ message +'&sender=QUICLN&route=6&country=91&DLT_TE_ID=1207162495401159900';
    console.log(url);
    try {
    const { data } = await axios.get(`${url}`);
    console.log(data, 'this is the otp response', phone);
    return true;

} catch (error) {
    console.log(error, 'Error in sending otp !');
    return false
}
}

const random = () => {
    return Math.floor(Math.random() * 900000) + 100000;
}

router.get('/googleLogin', passport.authenticate('google', { scope: ['profile', 'email'] }),async(req, res) => {
console.log('Api gets hit !')
});

router.get('/fbLogin', passport.authenticate('facebook', { scope: ['profile', 'email'] }),async(req, res) => {

});

router.get(
    "/auth/google/callback",
    passport.authenticate("google"),
    async (req, res) => {
        try {
    //   console.log(req.user._json, 'this is user data');
      const { name, email } = req.user._json;
      let user, token = '';
      user = await User.findOne({ email }).lean();
      if(!user) {
        user = {
            name, email, registration_type: 'google'
        }
        // user = await new User(newUser).save();
      }
      token = await createToken({
        user
    });
    res.redirect(`/api/user/success/${token}`);
    } catch (error) {
        console.log(error, 'Error in google callback');
        res.redirect(`/api/user/failure`)
    }
    }
  );


  router.get('/success/:jwt', (req, res) => {
    res.send(req.params.jwt)
})

router.get('/failure', (req, res) => {
    response(res, 500, createResponse('Error in login'))
});

router.get('/requestOtp/:phone', async(req, res) => {
    try {
        const { phone } = req.params;
        const timestamp = new Date().getTime(), limit = 21600000;
        const user = await User.findOne({ phone });
        let sendOtp = true;
        if(!user) {
            const otp = await Otp.findOne({ phone });
            if(otp) {
                if(otp.otp_count === 2) {
                    ((otp.last_sent + limit) < timestamp) ? sendOtp = true : sendOtp = false;
                    if(sendOtp) {
                        otp.last_sent = timestamp;
                    }
                    console.log(sendOtp, new Date(otp.last_sent).toISOString(), '***', new Date(timestamp).toISOString(), 'check this out')
                } else {
                    otp.otp_count = 2;
                    otp.last_sent = timestamp;
                }
                await otp.save();
            } else {
                const newOtp = {
                    phone, otp, last_sent: timestamp
                }
                await new Otp(newOtp).save();
            }
        } else {
            if(user.otp_count === 2) {
            ((user.last_otp_request + limit) < timestamp) ? sendOtp = true : sendOtp = false;
            if(sendOtp) {
                user.last_otp_request = timestamp;
                user.otp_count = 1;
            }
            }
            user.otp_count = 2;
            await user.save();
        }
        // if(sendOtp) {
            const r = random();
            const otp = await sendServerOtp(`${r} is your OTP code for Quick Loans and is valid for 15 minutes. Do not share it with anyone.`, req.params.phone);
            console.log(otp, 'Otp response');
            return response(res, 200, createResponse(`${r}`))
        // } else {
        //     return response(res, 400, createResponse(`Otp request not processed , Please try again after sometime !`));
        // }
    } catch (error) {
        console.log(error, 'Error in requesting otp');
        response(res, 500, createResponse('Error in requesting otp'))
    }
});

router.post('/createUser', [
    check('phone')
    .not()
    .isEmpty(),
    validationCheck
], async(req, res) => {
    try {
        const { email, name, phone } = req.body;
        let user = await User.findOne({ $or: [ { email } , { phone } ] });
        console.log(user, 'user exists ???')
        if(!user) {
        const newUser = {
            phone
        }
        if(email) {
            newUser.email = email;
            newUser.name = name;
        }
        user = await new User(newUser).save();
    }
    const token = await createToken({ user })
        const finalData = {
            token, user
        }
        response(res, 200, createResponse(finalData));
    } catch (error) {
        console.log(error, 'Error in creating user !');
        response(res, 500, createResponse('Error in creating user !'))
    }
});

router.get('/decodeToken/:token', async(req, res, next) => {
    try {
        const { token } = req.params;
        console.log(token, 'check this token')
        const resp = await decodeToken(token);
        response(res, 200, createResponse(resp));
    } catch (error) {
        console.log(error, 'Error in decoding token');
        response(res, 500, createResponse('Error in decoding token !'))
    }
})


router.post('/loginOtp', [
    check('phone', 'Please provide valid phone number !')
    .isLength({ max: 10, min: 10 }),
    check('email')
    .not()
    .isEmpty(),
    validationCheck
], async(req, res) => {
    try {
        const { phone } = req.body;
        // const phone = '9726464473';
        let user, token = '';
        user = await User.findOne({ phone });
        const timestamp = new Date().getTime(), limit = 21600000;
        // The above milliseconds are in 6 hrs.
        let sendOtp = true;
        if(!user) {
            const newUser = {
                phone, last_otp_request: timestamp
            }
            user = await new User(newUser).save();
        } else {

            ((user.last_otp_request + limit) > timestamp) ? sendOtp = true : sendOtp = false;
            user.last_otp_request = new Date().getTime();
            await user.save();
        }
        if(!sendOtp) {
            return response(res, 400, createResponse(`Please request otp after ${(user.last_otp_request + limit) - timestamp}`))
        }
        token = await createToken({
            user
        });
        const r = random();
        const otp = await sendServerOtp(`Your otp for quick loan is ${r}`);
        if(!otp) {
            response(res, 400, createResponse('Something went wrong, please try again !'))
        }
        const finalData = {
            token, otp: r, user
        }
        response(res, 200, createResponse(finalData));
    } catch (error) {
        console.log(error, 'Error in login with otp !');
        response(res, 500, createResponse('Error in login with otp !'))
    }
});

router.post('/profile_1', [
    verify,
    check('name')
    .not()
    .isEmpty(),
    check('email')
    .not()
    .isEmpty(),
    check('dob')
    .not()
    .isEmpty(),
    check('gender')
    .not()
    .isEmpty(),
    check('marital_status')
    .not()
    .isEmpty(),
    check('state')
    .not()
    .isEmpty(),
    check('city')
    .not()
    .isEmpty(),
    check('pincode')
    .not()
    .isEmpty(),
    check('address')
    .not()
    .isEmpty(),
    validationCheck
], async(req, res) => {
try {
    // marital status, state, city, pincode
    let { name, email, dob, gender, marital_status, state, city, pincode, address } = req.body;
    const { _id } = req.user;
    const user = await User.findOne({ _id });
    if(!user) {
        return response(res, 400, createResponse('Invalid Request !'));
    }
    delete req.body._id;
    dob = new Date(dob).toISOString();
    user.set({
        name, email, dob, gender, profile_status: 'second', marital_status, state, city, pincode, address
    });
    await user.save();
    response(res, 200, createResponse(user));
} catch (error) {
    console.log(error, 'Error in updating user profile');
    response(res, 500, createResponse('Error in updating user profile !'))
}
});

router.post('/profile_2', [
    verify,
    check('pincode')
    .not()
    .isEmpty(),
    check('employment_type')
    .not()
    .isEmpty(),
    check('income')
    .not()
    .isEmpty(),
    check('profession')
    .not()
    .isEmpty(),
    check('current_emi')
    .not()
    .isEmpty(),
    check('required_loan_amount')
    .not()
    .isEmpty(),
    check('household_liabilities')
    .not()
    .isEmpty(),
    check('pan_card_number')
    .not()
    .isEmpty(),
    validationCheck
], async(req, res) => {
    try {
        const { body: { pincode, employment_type, income, profession, current_emi, current_emi_amount,required_loan_amount, household_liabilities, pan_card_number }, user: { _id } } = req;
        const user = await User.findOne({ _id });
        if(!user) {
            return response(res, 400, createResponse('User not found !'))
        }
        user.set({
            pincode, employment_type, income, profession, profile_status: 'completed', current_emi, current_emi_amount,required_loan_amount, household_liabilities, pan_card_number
        });
        await user.save();
        response(res, 200, createResponse(user));
    } catch (error) {
        console.log(error, 'Error in profile 2');
        response(res, 500, createResponse('Error in profile 2'))
    }
})

router.get('/getUser', verify,async(req, res) => {
    try {
        console.log(req.user, 'this is the decoded user !')
        const url = req.protocol + "://" + req.get("host") + '/api';
        // const user = await User.findOne({ _id: req.user._id });
        const user = await User.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(req.user._id),
                    // email: req.user.email
                }
            },
            {
                $project: {
                    data: '$$ROOT',
                    aadhar_1: {
                        $concat: [url, '$aadhar_1']
                    },
                    pan: {
                        $concat: [url, '$pan']
                    },
                    profile_pic: {
                        $concat: [url, '$profile_pic']
                    },
                    aadhar_2: {
                        $concat: [url, '$aadhar_2']
                    },
                }
            }
        ])
        // if(!user[0]) {
        //     return response(res, 400, createResponse('Invalid Request !'))
        // }
        response(res, 200, createResponse(user[0]))
    } catch (error) {
        console.log(error, 'Error in getting user');
        response(res, 500, createResponse('Error in getting user '))
    }
});

router.post('/storeImage', [
    verify,
    imageUpload.single('image'),
    check('type')
    .not()
    .isEmpty(),
    validationCheck
], async(req, res) => {
    try {
        const { body: { type }, file: { filename }, user: { _id } } = req;
        if(type !== 'aadhar' && type !== 'pan' && type !== 'profile_pic') {
            return response(res, 400, createResponse('Please provide a valid type !'))
        }
        if(!filename) {
            return response(res, 400, createResponse('Please provide aadhar Image !'))
        }
        const user = await User.findOne({ _id });
        if(!user) {
            return response(res, 400, createResponse('User not found !'))
        }
        user[type] = imageFolder + filename;
        await user.save();
        response(res, 200, createResponse(user));
    } catch (error) {
        console.log(error, 'Error in storing aadhar image !');
        response(res, 500, createResponse('Error in storing aadhar image !'))
    }
});




router.post('/toggle_profile', [
    verifyAdmin,
    check('_id')
    .not()
    .isEmpty()
], async(req, res) => {
    // Make verify admin afterwards
    try {
        const { _id } = req.body;
        const user = await User.findOne({ _id });
        user.verified = !user.verified;
        await user.save();
        response(res, 200, createResponse(user));
    } catch (error) {
        console.log(error, 'Error in changing user status');
        response(res, 500, createResponse('Error in changing user status'))
    }
});


router.get('/getUsers/:page', verifyAdmin, async(req, res) => {
    // Make the middleware verifyadmin afterwards !
    try {
        const url = req.protocol + "://" + req.get("host") + '/api';
        const { page } = req.params;
        if(!page) {
            return response(res, 400, createResponse('Please provide page !'))
        }
        const limit = 15;
        const users = await User.aggregate([
            {
                $match: {
                    is_admin: false
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            },
            {
                $project: {
                    data: '$$ROOT',
                    aadhar_1: {
                        $concat: [url, '$aadhar_1']
                    },
                    pan: {
                        $concat: [url, '$pan']
                    },
                    profile_pic: {
                        $concat: [url, '$profile_pic']
                    },
                    aadhar_2: {
                        $concat: [url, '$aadhar_2']
                    }
                }
            }
        ]);
        const count = await User.countDocuments({
            is_admin: false
        });
        const finalData = {
            users, count
        }
        response(res, 200, createResponse(finalData));
    } catch (error) {
        console.log(error, 'Error in gettting users');
        response(res, 500, createResponse('Error in getting users !'))
    }
});

router.get('/exportUsers', async(req, res) => {
    try {
        const users = await User.find().lean();
        response(res, 200, createResponse(users));
    } catch (error) {
        console.log(error, 'Error in getting all users !');
        response(res, 500, createResponse('Error in getting all users !'))
    }
});

router.post('/adminLogin', async(req, res) => {
    try {
        const { email, password } = req.body;
        if(!email) {
            return response(res, 400, createResponse('Invalid credentails !'))
        }
        const user = await User.findOne({ email, is_admin: true });
        console.log(user);
        if(!user) {
            return response(res, 400, createResponse('User not found !'))
        }
        if(password !== 'quick@admin#123') {
            return response(res, 400, createResponse('Invalid credentails !'))
        }
        const token = await createToken({ user });
        const finalPayload = {
            token, user
        }
        response(res, 200, createResponse(finalPayload));
    } catch (error) {
        console.log(error,'Error in admin login');
        response(res, 400, createResponse("Error in admin login !"))
    }
});

router.get('/paidUsers/:page', verifyAdmin, async(req, res) => {
    // Make the middleware verifyadmin afterwards !
    try {
        const url = req.protocol + "://" + req.get("host") + '/api';
        const { page } = req.params;
        if(!page) {
            return response(res, 400, createResponse('Please provide page !'))
        }
        const limit = 15;
        const users = await User.aggregate([
            {
                $match: {
                    is_admin: false,
                    paid: true
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            },
            {
                $project: {
                    data: '$$ROOT',
                    aadhar_1: {
                        $concat: [url, '$aadhar_1']
                    },
                    pan: {
                        $concat: [url, '$pan']
                    },
                    profile_pic: {
                        $concat: [url, '$profile_pic']
                    },
                    aadhar_2: {
                        $concat: [url, '$aadhar_2']
                    }
                }
            }
        ]);
        const count = await User.countDocuments({
            is_admin: false, paid: true
        });
        const finalData = {
            users, count
        }
        response(res, 200, createResponse(finalData));
    } catch (error) {
        console.log(error, 'Error in gettting users');
        response(res, 500, createResponse('Error in getting users !'))
    }
});

router.get('/unpaidUsers/:page', verifyAdmin, async(req, res) => {
    // Make the middleware verifyadmin afterwards !
    try {
        const url = req.protocol + "://" + req.get("host") + '/api';
        const { page } = req.params;
        if(!page) {
            return response(res, 400, createResponse('Please provide page !'))
        }
        const limit = 15;
        const users = await User.aggregate([
            {
                $match: {
                    is_admin: false,
                    paid: false
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            },
            {
                $project: {
                    data: '$$ROOT',
                    aadhar_1: {
                        $concat: [url, '$aadhar_1']
                    },
                    pan: {
                        $concat: [url, '$pan']
                    },
                    profile_pic: {
                        $concat: [url, '$profile_pic']
                    },
                    aadhar_2: {
                        $concat: [url, '$aadhar_2']
                    }
                }
            }
        ]);
        const count = await User.countDocuments({
            is_admin: false, paid: false
        });
        const finalData = {
            users, count
        }
        response(res, 200, createResponse(finalData));
    } catch (error) {
        console.log(error, 'Error in gettting users');
        response(res, 500, createResponse('Error in getting users !'))
    }
});

router.post('/sendMessage', [
    verify,
    check('_id')
    .not()
    .isEmpty(),
    check('message')
    .not()
    .isEmpty(),
    validationCheck
],async(req, res) => {
    try {
        const { _id, message } = req.body;
        const user = await User.findOne({ _id }).lean();
        if(!user || !user.phone) {
            return response(res, 400, createResponse("Something went wrong !"))
        }
        sendServerOtp(message, user.phone);
        response(res, 200, createResponse('Done'));
    } catch (error) {
        console.log(error, 'Error in sending message')
        response(res, 500, 'Error in sending message')
    }
})

module.exports = router;
