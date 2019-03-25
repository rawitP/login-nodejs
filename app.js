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

const PORT = 3000;

passport.use(new Strategy(
    function(username, password, cb) {
        db.users.findByUsername(username, function(err, user) {
            if (err) { return cb(err); }
            if (!user) { return cb(null, false); }
            if (user.password != password) { return cb(null, false); }
            return cb(null, user);
        });
    }));

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

app.get('/api/logout',
    connectEnsureLogin.ensureLoggedIn(),
    function(req, res) {
        req.logout();
        res.status(200).end();
    }
);

app.get('/api/profile',
    connectEnsureLogin.ensureLoggedIn(),
    function(req, res) {
        res.json({displayName: req.user.displayName});
    }
);

app.get('/', (req,res) => res.send('Hello World!'));

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
