// var log = require('lib/log')(module);
var express = require('express');
var config = require('config');
var connect = require('connect'); // npm i connect
var async = require('async');
var cookie = require('cookie');   // npm i cookie
var sessionStore = require('lib/sessionStore');
var HttpError = require('error').HttpError;
var User = require('models/user').User;

function loadSession(sid, callback) {

    sessionStore.load(sid, function(err, session) { //load - умеет по sid находить объект сессии session в базе данных монго
        if (arguments.length == 0) {
            // no arguments => no session
            return callback(null, null);
        } else {
            return callback(null, session);
        }
    });
}

function loadUser(session, callback) {

    if (!session.user) {
        console.log("Session %s is anonymous" + session.id);
        return callback(null, null);
    }

    User.findById(session.user, function(err, user) {
        if (err) return callback(err);

        if (!user) {
            return callback(null, null);
        }
        callback(null, user);
    });

}

module.exports = function(server) {
    var io = require('socket.io').listen(server);

    io.set('origins', 'localhost:*' ); // устанавливаем опцию: домен может быть только локалхост, порт = * т.е. любой io.attach(3000);
    // io.set('logger', log); // опция логгер позволяет указать свой объект в который будет осуществляться логгирование


    io.use(function(socket, next){

        async.waterfall([

            function(callback) {
                var secret = config.get('session:secret');
                var sessionKey = config.get('session:key');

                var cookieParser = express.cookieParser(secret);
                cookieParser(socket.handshake, {}, function (err) {
                    if (err) return callback(err);

                    var sid = socket.handshake.signedCookies[sessionKey]; // y handshake появилось поле 'signedCookies'

                    loadSession(sid, callback);
                });
            },
            function(session, callback) {

                if (!session) {
                    callback(new HttpError(401, "No session"));
                }

                socket.handshake.session = session;
                loadUser(session, callback);
            },
            function(user, callback) {
                if (!user) {
                    callback(new HttpError(403, "Anonymous session may not connect"));
                }

                socket.handshake.user = user;
                callback(null);
            }

        ], function(err) {
            if (!err) {
                console.log("ошибки нет при создании сокета");
                return next();
            }

            if (err instanceof HttpError) {
                console.log(err);
                next(err);
            }

            console.log("index.js: ne HttpError"); // если непонятная ошибка, то socket.io с ней как-то разберется
            next(err);
        });

    });


    io.on('connection', function(socket) {

        var username = socket.handshake.user.username;

        socket.broadcast.emit('join', username);

        socket.on('message', function(text, cb) {
            socket.broadcast.emit('message', username, text); // отправит сообщение всем соединениям кроме данного
            cb(); // та самая функция, которая запускает путем передачи любых данных на клиенте третий аргумент emit-a "message" (функцию)
        });

        socket.on('disconnect', function() {
            socket.broadcast.emit('leave', username);
        });

        socket.on('log_out', function() {
            socket.handshake.session.destroy(function (err) {});
            socket.disconnect();
        });


    });

    return io;
};
