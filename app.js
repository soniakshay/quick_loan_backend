const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const { folders } = require('./config/image')
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const https = require('https');
const cors = require('cors');
const http = require('http');
const { User } = require('./models/user');


const passport = require('passport');
require("./config/passport")(passport);

app.use(passport.initialize());
app.use(passport.session());

app.use(cors())



app.use(express.static(path.join(__dirname + '/')))

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// app.engine('handlebars', exphbs());
// app.set('view engine', 'handlebars');

const PORT = process.env.PORT || 5000;


const start = async() => {
    try {
    const status = await mongoose.connect('mongodb+srv://loan:quickloan@cluster0.7bmff.azure.mongodb.net/quickloan?retryWrites=true&w=majority', {
        useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true,
    })
        console.log('Mongo Connected !');
let httpServer;
try {
  const privateKey = fs.readFileSync('/etc/letsencrypt/live/quickloans.today/privkey.pem', 'utf8');
  const certificate = fs.readFileSync('/etc/letsencrypt/live/quickloans.today/cert.pem', 'utf8');
  const ca = fs.readFileSync('/etc/letsencrypt/live/quickloans.today/chain.pem', 'utf8');
  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  };
  httpServer = https.createServer(credentials, app);
  httpServer.listen(5001, () => {
    console.log('%s App is running at https://localhost:%d in %s mode', 5001);
  });
} catch (e) {
    console.log(`Cannot run HTTPS ${5001}`, e);
  httpServer = http.createServer(app);
  httpServer.listen(5000, async () => {
    console.log(e, 'HTTP Server running on port 5000');
    // runScript()

  });

}

//         httpServer = http.createServer(app);
//         httpServer.listen(5000, async () => {
//             console.log( 'HTTP Server running on port 5000');
//             // runScript()

//         });
for(const f of folders) {
    fs.mkdirSync(`${__dirname}${f}`, {
      recursive: true
    })
  }
} catch (error) {
    console.log(error, 'Error in connecting DB !')
}
}
start();

app.get('/testingRoute', (req, res) => {
    res.send('Server is working successfully !')
});

app.use('/user', require('./routes/user'));
app.use('/payment', require('./routes/payment'));
app.use('/order', require('./routes/orders'));

// address key in profile_form_1 - done
// create order api contact array ma add new key relation with contact name and contact number - done
// update last_paid time stamp in create order api - done
// contact us api
// user filter api - done
