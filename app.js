const express = require('express');
// Passport js
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const session = require('express-session');
const bodyParser = require('body-parser');
const connectEnsureLogin = require('connect-ensure-login');
//
const path = require('path');
const db = require(path.join(__dirname, 'db'));
const crypto = require('crypto');

const PORT = 3000;

passport.use(new Strategy(
    function(username, password, cb) {
        db.users.findByUsername(username, function(err, user) {
            if (err) { return cb(err); }
            if (!user) { return cb(null, false); }
            var hash = crypto.createHmac('sha256', user.salt).update(password).digest('hex');
            if (user.password != hash) { return cb(null, false); }
            return cb(null, user);
        });
    })
);

passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    db.users.findById(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    });
});

const app = express();

// Serve public files
app.use(express.static(path.join(__dirname, 'public')));
// Passport js
app.use(session({ secret: 'cats' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
//

app.post('/api/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.status(401).end(); }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.status(200).end();
        });
    })(req, res, next);
});

app.get('/api/logout', function(req, res) {
    if (req.isAuthenticated()) {
        req.logout();
        res.status(200).end();
    } else {
        res.status(401).end();
    }
});

app.get('/api/profile', function(req, res) {
    if (req.isAuthenticated()) {
        res.json({displayName: req.user.username});
    } else {
        res.status(401).end();
    }
});

app.post('/api/register', function(req, res) {
    db.users.insertUser(req.body.username, req.body.password).then(result => {
        if (result) {
            res.status(200).end();
        } else {
            res.status(500).end();
        }
    });
});

app.get('/', (req,res) => res.send('Hello World!'));

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
