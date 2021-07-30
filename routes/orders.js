const express = require("express");
const { check } = require("express-validator");
const { verify, verifyAdmin } = require("../config/jwt");
const { validationCheck } = require("../config/errorCheck");
const { Order } = require("../models/orders");
const { response, createResponse } = require("../config/response");
const { User } = require("../models/user");
const router = express.Router();
const axios = require("axios");
const moment = require("moment");
const { customUpload, imageUpload } = require("../config/image");
const mongoose = require("mongoose");

// Sms api
const smsAuthKey = "36855AaIxKbYnyv5fe1d661P30",
  route_no = 6,
  sender_id = "QUICLN",

    sms_url = "http://fastsms.fastsmsindia.com/api/sendhttp.php";

const sendServerOtp = async (message, phone) => {
  console.log(message);
  try {
    const url =
        'http://fastsms.fastsmsindia.com/api/sendhttp.php?authkey=36855AaIxKbYnyv5fe1d661P30&mobiles='+phone+ '&message=' + message +'&sender=QUICLN&route=6&country=91&DLT_TE_ID=1207162495401159900';
    const { data } = await axios.get(`${url}`);
    console.log(data, "this is the otp response", phone);
    return true;
  } catch (error) {
    console.log(error, "Error in sending otp !");
    return false;
  }
};

router.post(
  "/initiateOrder",
  [
    verify,
    customUpload,
    check("loan_type").not().isEmpty(),
    check("date").not().isEmpty(),
    check('order_id')
    .not().isEmpty(),
    validationCheck,
  ],
  async (req, res) => {
    try {
      const {
        user: { _id },
        body: { loan_type, date, contacts, order_id },
        files,
      } = req;
      const order = await Order.findOne({ _id: order_id });
      if(!order) {
        return response(res, 400, createResponse('Something went wrong !'))
      }

      const aadhar_1 = files.find((f) => f.key === "aadhar_1");
      const aadhar_2 = files.find((f) => f.key === "aadhar_2");
      if (!aadhar_1 || !aadhar_2) {
        return response(
          res,
          400,
          createResponse("Please provide aadhar images to place order !")
        );
      }
      const current = new Date().getTime();
      const user = await User.findOne({ _id }).lean();

      if (!user) {
        return response(res, 400, createResponse("Something went wrong !"));
      }
      // if (user.last_order && user.last_order + 7889400000 > current) {
      //   const ms = user.last_order + 7889400000 - current;
      //   const diff = new moment.duration(ms);
      //   return response(
      //     res,
      //     400,
      //     createResponse(
      //       `Please wait for ${Math.ceil(
      //         diff.asDays()
      //       )} days before making another loan request !`
      //     )
      //   );
      // }
      // const newOrder = {
      //   loan_type,
      //   date: new Date(date).toISOString(),
      //   user_id: _id,
      //   user_details: user,
      //   aadhar_1: aadhar_1.short_path,
      //   aadhar_2: aadhar_2.short_path,
      // };
      console.log('********', aadhar_1.short_path, aadhar_2,'check the aadhar path ***')
      order.set({
        aadhar_1: aadhar_1.short_path,
        aadhar_2: aadhar_2.short_path,
      });
      await order.save();
      // const order = await new Order(newOrder).save();
      // console.log(new Date().toISOString(), "end");
      response(res, 201, createResponse(order));
    } catch (error) {
      console.log(error, "Error in creating order !");
      response(res, 500, createResponse("Error in creating order !"));
    }
  }
);


router.post('/storeAadhar', [

])

// Done
router.post(
  "/createOrder",
  [
    verify,
    customUpload,
    check("contacts").not().isEmpty(),
    check("order_id").not().isEmpty(),
    validationCheck,
  ],
  async (req, res) => {
    try {
      const {
        body: { contacts, order_id },
        files,
        user: { _id }
      } = req;
      const user = await User.findOne({ _id });
      const order = await Order.findOne({ _id: order_id });
      if (!order || !user) {
        return response(res, 400, createResponse("Something went wrong !"));
      }
      const pan = files.find((f) => f.key === "pan");
      const profile_pic = files.find((f) => f.key === "profile_pic");
      if (!pan || !profile_pic) {
        return response(
          res,
          400,
          createResponse(
            "Please provide aadhar and pan images to place order !"
          )
        );
      }
      order.set({
        pan: pan.short_path,
        contacts,
        profile_pic: profile_pic.short_path,
        order_placed: true,
      });
      await order.save();
      if(user.paid) {
      const current = new Date().getTime();
      user.last_order = current;
      await user.save();
      }
      console.log(new Date().toISOString(), "end order");
      response(res, 200, createResponse(order));
    } catch (error) {
      console.log(error, "Error in creating order !");
      response(res, 500, createResponse("Error in creating order !"));
    }
  }
);

router.post(
  "/order_status",
  [
    verifyAdmin,
    check("order_id").not().isEmpty(),
    check("status").not().isEmpty(),
    check("message").not().isEmpty(),
    validationCheck,
  ],
  async (req, res) => {
    try {
      const { order_id, status, approval_amount, message } = req.body;
      // const order_id = '5fe1c8fd3dc4515a8822ba64', status = 'rejected';
      if (
        status !== "approved" &&
        status !== "rejected" &&
        status !== "pending"
      ) {
        return response(
          res,
          400,
          createResponse("Please provide status of the loan !")
        );
      }
      const order = await Order.findOne({ _id: order_id });
      // const user = await User.findOne({ _id: order.user_id });
      if (!order) {
        return response(res, 400, createResponse("No Loan found !"));
      }
      if (order.user_details.phone) {
        sendServerOtp(message, order.user_details.phone);
      }

      order.status = status;
      await order.save();
      response(res, 200, createResponse(order));
    } catch (error) {
      console.log(error, "Errro in changing loan status !");
      response(res, 500, createResponse("Error in changing loan status !"));
    }
  }
);

router.post(
  "/orders",
  [verify, check("page").not().isEmpty()],
  async (req, res) => {
    try {
      let {
        body: { page },
        user: { _id, is_admin },
      } = req;
      const url = req.protocol + "://" + req.get("host") + "/api";
      // let page = 1, _id = '5fe1c37a4c133159e7681de8', is_admin = false;
      page = parseInt(page);
      const limit = 15;
      let query = {
        order_placed: true,
        paid: true
      };
      if (!is_admin) {
        query = {
          user_id: _id,
          order_placed: true,
          paid: true
        };
      }
      const orders = await Order.aggregate([
        {
          $match: query,
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            data: "$$ROOT",
            aadhar_1: {
              $concat: [url, "$aadhar_1"],
            },
            aadhar_2: {
              $concat: [url, "$aadhar_2"],
            },
            pan: {
              $concat: [url, "$pan"],
            },
          },
        },
      ]);
      const count = await Order.countDocuments(query);
      const finalData = {
        count,
        orders,
      };
      console.log(orders, 'orders this is')
      response(res, 200, createResponse(finalData));
    } catch (error) {
      console.log(error, "Error in getting orders !");
      response(res, 500, createResponse("Error in getting orders !"));
    }
  }
);

router.get("/orderDetails/:order_id", async (req, res) => {
  try {
    const url = req.protocol + "://" + req.get("host") + "/api";
    const { order_id } = req.params;
    if (!order_id) {
      return response(res, 400, createResponse("Order Id not valid !"));
    }
    const obj = mongoose.Types.ObjectId(order_id);
    console.log(obj, "check it out");
    const order = await Order.aggregate([
      {
        $match: {
          _id: obj,
        },
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
              },
            },
            {
              $project: {
                data: "$$ROOT",
                pan: {
                  $concat: [url, "$pan"],
                },
                aadhar: {
                  $concat: [url, "$aadhar"],
                },
                profile_pic: {
                  $concat: [url, "$profile_pic"],
                },
              },
            },
          ],
          as: "user",
        },
      },
      {
        $project: {
          data: "$$ROOT",
          aadhar_1: {
            $concat: [url, "$aadhar_1"],
          },
          aadhar_2: {
            $concat: [url, "$aadhar_2"],
          },
          pan: {
            $concat: [url, "$pan"],
          },
        },
      },
    ]);
    response(res, 200, createResponse(order));
  } catch (error) {
    console.log(error, "Error in getting order details !");
    response(res, 500, createResponse("Error in getting order details "));
  }
});

router.get("/exportOrders", async (req, res) => {
  try {
    const orders = await Order.find({
      order_placed: true,
    }).lean();
    response(res, 200, createResponse(orders));
  } catch (error) {
    console.log(error, "Error in getting all orders !");
    response(res, 500, createResponse("Error in getting all orders !"));
  }
});

router.post("/lastOrderCheck", [
  verify,
  check("loan_type").not().isEmpty(),
    check("date").not().isEmpty(),
    validationCheck
], async (req, res) => {
  try {
    const { user: { _id }, body: { loan_type, date } } = req;
    const orders = await Order.aggregate([
      {
        $match: {
          user_id: _id,
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
    ]);
    const order = orders[0];
    if (!order) {
      const user = await User.findOne({ _id }).lean();
      const newOrder = {
        loan_type,
        date: new Date(date).toISOString(),
        user_id: _id,
        user_details: user
      };
      if(user.paid) {
        newOrder.paid = true;
      }
      const created = await new Order(newOrder).save();
      return response(
        res,
        200,
        createResponse({
          place: true,
          msg: "",
          order: created
        })
      );
    }
    console.log(order ,'check this order')
    if (order) {
      console.log(order.order_placed, 'this is place order console')
      if (!order.order_placed) {
        return response(
          res,
          200,
          createResponse({
            place: true,
            msg: "",
            order
          })
        );
      } else {
        const current = new Date().getTime();
        const user = await User.findOne({ _id }).lean();
        if (!user) {
          return response(res, 400, createResponse("Something went wrong !"));
        }
        console.log(user.last_order, 'this is last ordet ts')
        if (user.last_order && user.last_order + 7889400000 > current) {
          const ms = user.last_order + 7889400000 - current;
          const diff = new moment.duration(ms);
          if(user.paid) {
            return response(
              res,
              400,
              createResponse({
                place: false,
                msg: `Please wait for ${Math.ceil(
                  diff.asDays()
                )} days before making another loan request !`,
              })
            );
          } else {
            return response(
              res,
              200,
              createResponse({
                place: true,
                order,
                msg: ''
              })
            );

          }
        }
        console.log('comes out')
      }
    }
    // console.log(order, "ended");
    response(res, 200, createResponse({
      place: true,
            msg: "",
            order
    }))
  } catch (error) {
    console.log(error, "Error in last order check");
    response(res, 500, createResponse("Error in last order chekc"))
  }
});

module.exports = router;
