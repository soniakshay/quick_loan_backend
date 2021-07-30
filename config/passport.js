const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FbStrategy = require('passport-facebook').Strategy;
const user = require('../models/user');

const ClientId =
    "187416633947-84p69b6jjohkvsj4t8n65j6s563o71qu.apps.googleusercontent.com";
const ClientSecret =
    "xyWT5r5kjseMqivgsS95yY-j";
const RedirectionUrl =
    "auth/google/callback";

    
    
module.exports = async function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: ClientId,
                clientSecret: ClientSecret,
                // callbackURL: 'http://localhost:5000/user/auth/google/callback'
                callbackURL: 'https://quickloans.today/api/user/auth/google/callback'
                // callbackURL: 'https://shrouded-inlet-06102.herokuapp.com/user/auth/google/callback'
            },
            (accessToken, refreshToken, profile, done) => {
                // console.log(accessToken);
                console.log(accessToken, refreshToken, profile);
                    done(null, profile)
            }
        )
    );

    passport.use(
        new FbStrategy(
            {
                clientID: '975084186285420',
                clientSecret: '3279be2193509bf9c8434e2cbddac8e2',
                callbackURL: "https://shrouded-inlet-06102.herokuapp.com/auth/google/callback"
                // callbackURL: 'http://localhost:5000/user/auth/fb/callback'
            },
            (accessToken, refreshToken, profile, done) => {
                // console.log(accessToken);
                console.log(accessToken, refreshToken, profile, 'from passport');
                    done(null, profile)
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((id, done) => {
        // google.findById(id).then(user => done(null, user));
        done(null, id)

    });
};
