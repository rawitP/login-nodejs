const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db_path = path.join(__dirname,'..','db.sqlite3');
const crypto = require('crypto');

const db = new sqlite3.Database(db_path, err => {
    if (err) { console.error(err.message); }
    console.log('Connected to the database.');
});

exports.findByUsername = function(username, cb) {
    db.get(`SELECT * FROM user WHERE username = ?`, [username], (err, row) => {
        if (err) { return cb(new Error); }
        return cb(null, row);
    });
};

exports.findById = function(id, cb) {
    db.get(`SELECT * FROM user WHERE id = ?`, [id], (err, row) => {
        if (err) {
            cb(new Error);
        } else if (row) {
            cb(null, row);
        } else {
            cb(new Error('User id does not exist'));
        }
    });
};

exports.insertUser = function(username, password) {
    return new Promise((resolve, reject) => {
        var salt = crypto.randomBytes(32).toString('hex');
        var hashed = crypto.createHmac('sha256', salt).update(password).digest('hex');
        db.run(`INSERT INTO user(username, password, salt) VALUES(?, ?, ?)`, [username, hashed, salt], function(err) {
            if (err) {
                resolve(false);
            }
            resolve(true);
        });
    });
};

// Uncomment to setup table
/*
db.serialize(function() {
    db.run('CREATE TABLE user ( id    INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, username  TEXT NOT NULL UNIQUE, password  TEXT NOT NULL, salt  TEXT NOT NULL)');
    //db.run('INSERT INTO user(username, password, salt) VALUES("jack", "secret", "1q2w3e4r")');
});
*/


