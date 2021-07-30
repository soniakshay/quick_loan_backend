const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

const Razorpay = require('razorpay');
const { verifyAdmin } = require('../config/jwt');
const { createResponse, response } = require('../config/response');
const { Order } = require('../models/orders');
const { Transaction } = require('../models/transaction');
const { User } = require('../models/user');
// Below are the test keys
// const r_id = 'rzp_test_Re66ey7eFpmkCq';
// const r_secret = 'S2HtDBiwJkxkSoC9zNgMNaq3';

// below are the live keys
const r_id = 'rzp_live_IaTT7YqJty0txN';
const r_secret = '0Ssa55hdg33ZvPWpjGb05gN3';
const rz = new Razorpay({
    key_id: r_id,
    key_secret: r_secret
});




router.get('/pay_page/:user_id', async(req, res) => {
    try {
        let { amount, user_id } = req.params;
        amount = 1;
        const r = Math.ceil(Math.random() * 900000) + 900000;
        console.log(r, 'this is random number')
        const user = await User.findOne({ _id: user_id });
        if(!user) {
            return response(res, 400, createResponse('Something went wrong !'))
        }
        const options = {
            amount: amount * 100, 
            currency: "INR",
            receipt: `${r}-${user_id}`,
            payment_capture: '1',
            notes: {
                originalAmount: amount, user_id
            }
          };
        const order = await rz.orders.create(options);
        return res.render('payment', {
            success: true, amount: parseFloat(amount), id: order.id, user_id
        })
    } catch (error) {
        console.log(error, 'Error in processing payment !');
        response(res, 500, createResponse('Error in processing payment !'))
    }
});

router.post('/rz_payment/:user_id', async(req, res) => {
    try {
    const { user_id } = req.params;
    const user = await User.findOne({ _id: user_id });
    if(!user) {
        return response(res, 400, createResponse('Something went wrong !'))
    };
    const date = new Date().toISOString();
    user.payment_details = req.body;
    user.pay_date = date;
    user.paid = true;
    const current = new Date().getTime();
    console.log(current, 'this is current ts')
    user.last_order = current;
    const newTransaction = {
        payment_details: req.body, user_id: user._id, pay_date: date
    }
    await new Transaction(newTransaction).save();
    await user.save();
    response(res, 200, createResponse(user))
    const orders = await Order.find({ paid: false, user_id: user._id });
    if(orders.length > 0) {
        for(const o of orders) {
            o.paid = true;
            await o.save();
        }
    }
} catch (error) {
    console.log(error, 'Error in rz payment !' );
    response(res, 500, createResponse('Error in razorpay payment !'))
}
});

router.post('/transactionList', [
    verifyAdmin,
    check('page')
    .not()
    .isEmpty()
], async(req, res) => {
    try {
        let { page } = req.body;
        page = parseInt(page);
        let limit = 15;
        const ts = await Transaction.aggregate([
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: "users",
                    let: { user_id: { $toObjectId: "$user_id" } },
                    pipeline: [
                        {
                            $match: {
                              $expr: {
                                $eq: ["$$user_id", "$_id"],
                              },
                            }
                          },
                          {
                              $project: {
                                  data: '$$ROOT',
                                  pan: {
                                      $concat: [url, '$pan']
                                  },
                                  aadhar: {
                                      $concat: [url, '$aadhar']
                                  },
                                  profile_pic: {
                                      $concat: [url, '$profile_pic']
                                  }
                              }
                          }
                    ],
                    as: 'user'
                }
            }
        ]);
        const count = await Transaction.countDocuments();
        const finalData = {
            count, ts
        }
        response(res, 200, createResponse(finalData));
    } catch (error) {
        console.log(error, 'Error in getting transaction list !');
        response(res, 500, createResponse('Error in getting transaction list !'))
    }
})

module.exports = router;