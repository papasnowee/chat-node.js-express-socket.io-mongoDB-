// var log = require('lib/log')(module);
var express = require('express');
var config = require('config');
var connect = require('connect'); // npm i connect
var async = require('async');
var cookie = require('cookie');   // npm i cookie
var cookieParser = require('cookie-parser');
var sessionStore = require('lib/sessionStore');
var HttpError = require('error').HttpError;
var User = require('models/user').User;

function loadSession(sid, callback) {

    // sessionStore callback is not quite async-style!
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

    console.log("retrieving user " + session.user);

    User.findById(session.user, function(err, user) {
        if (err) return callback(err);

        if (!user) {
            return callback(null, null);
        }
        console.log("user findbyId result: " + user);
        callback(null, user);
    });

}

module.exports = function(server) {
    var io = require('socket.io').listen(server);

    io.set('origins', 'localhost:*' ); // устанавливаем опцию: домен может быть только локалхост, порт = * т.е. любой io.attach(3000);
    // io.set('logger', log); // опция логгер позволяет указать свой объект в который будет осуществляться логгирование


    // io.set('authorization', function(handshake, callback) {
    //     handshake.fooo = 'svoistvo fooo';
    //     async.waterfall([
    //         function(callback) {
    //             // сделать handshakeData.cookies - объектом с cookie
    //             handshake.cookies = cookie.parse(handshake.headers.cookie || ''); // используем модуль cookie для извлечения куки из handshake
    //             console.log("handshake.cookies  "+JSON.stringify(handshake.cookies));
    //             var sidCookie = handshake.cookies[config.get('session:key')]; // получаем куку с идентификатором сессии, но этот идент-р подписан
    //             var sid = connect.utils.parseSignedCookie(sidCookie, config.get('session:secret')); // используя метод connect-a очищаем идент-р от подписи
    //
    //             loadSession(sid, callback);  // loadSession это всего лишь обертка для красоты кода и для того, что бы callback вызвался
    //             // с аргументами в соответсвии со стандартом, т.к. sessionStore.load(sid, function(err, session) {...} вызывает свой
    //             // коллбек не в соответсвие с стандартом (43 видео 10-00)
    //         },
    //
    //
    //         // function(callback) {
    //         //     var secret = config.get('session:secret');
    //         //     var sessionKey = config.get('session:key');
    //         //
    //         //     console.log(handshake.signedCookies + ' 123'); // undefined
    //         //
    //         //     var cookieParser = express.cookieParser(secret);
    //         //     cookieParser(handshake, {}, function (err) {
    //         //         if (err) return callback(err);
    //         //
    //         //         var sid = handshake.signedCookies[sessionKey]; // y handshake появилось поле 'signedCookies'
    //         //
    //         //         loadSession(sid, callback);
    //         //     });
    //         // },
    //         function(session, callback) {
    //
    //             if (!session) {
    //                 callback(new HttpError(401, "No session"));
    //             }
    //
    //             handshake.session = session;
    //             loadUser(session, callback);
    //         },
    //         function(user, callback) {
    //             if (!user) {
    //                 callback(new HttpError(403, "Anonymous session may not connect"));
    //             }
    //
    //             handshake.user = user;
    //             callback(null);
    //         }
    //
    //     ], function(err) {
    //         if (!err) {
    //             console.log("ошибки нет при создании сокета");
    //
    //             return callback(null, true); // ошибка - null, можно подключиться - true
    //         }
    //
    //         if (err instanceof HttpError) {
    //             return callback(null, false); // ошибку обработает экспресс?
    //         }
    //
    //         callback(err); // если непонятная ошибка, то socket.io с ней как-то разберется
    //     });
    //     callback(null, true);
    // });

    io.use(function(socket, next){
        // console.log("probuem zapisat svoystvo fooo");
        //
        // socket.handshake.fooo = 'svoistvo fooo';
        // next();
        async.waterfall([
            // function(callback) {
            //     // сделать handshakeData.cookies - объектом с cookie
            //     console.log('opa opa1');
            //     socket.handshake.cookies = cookie.parse(handshake.headers.cookie || ''); // используем модуль cookie для извлечения куки из handshake
            //     // console.log("handshake.cookies  "+JSON.stringify(handshake.cookies));
            //     console.log('opa opa2');
            //     var sidCookie = socket.handshake.cookies[config.get('session:key')]; // получаем куку с идентификатором сессии, но этот идент-р подписан
            //     var sid = connect.utils.parseSignedCookie(sidCookie, config.get('session:secret')); // используя метод connect-a очищаем идент-р от подписи
            //
            //     loadSession(sid, callback);  // loadSession это всего лишь обертка для красоты кода и для того, что бы callback вызвался
            //     // с аргументами в соответсвии со стандартом, т.к. sessionStore.load(sid, function(err, session) {...} вызывает свой
            //     // коллбек не в соответсвие с стандартом (43 видео 10-00)
            // },


            function(callback) {
                var secret = config.get('session:secret');
                var sessionKey = config.get('session:key');

                console.log(socket.handshake.signedCookies + ' 123'); // undefined

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
                next();
            }

            if (err instanceof HttpError) {
                console.log(err); // ошибку обработает экспресс?
                next(err);
            }

            console.log("index.js - ne HttpError"); // если непонятная ошибка, то socket.io с ней как-то разберется
            next(err);
        });

    });

    io.on('session:reload', function(sid) {
        var clients = io.sockets.clients(); // получаем все сокеты

        clients.forEach(function(client) { // в client лежит конкретный сокет
            if (client.handshake.session.id != sid) return;

            loadSession(sid, function(err, session) {
                if (err) {
                    client.emit("error", "server error");
                    client.disconnect();
                    return;
                }

                if (!session) {
                    client.emit("logout"); // запустит на КЛИЕНТЕ событие логаут
                    client.disconnect();
                    return;
                }

                client.handshake.session = session;
            });

        });

    });

    io.on('connection', function(socket) { // socket это объект, который связан с данным конкретным клиентом
        console.log("index.js on connection " + JSON.stringify(socket.handshake));
        console.log("index.js on connection " + socket.handshake.fooo);

        var username = socket.handshake.user.username;

        socket.broadcast.emit('join', username);

        socket.on('message', function(text, cb) { // получаем сообщение от клиента, безымянная функция обрабатывает пришедшие данные. .emit - генерирует события, on. - слушает.
            socket.broadcast.emit('message', username, text); // отправит сообщение всем соединениям кроме данного
            cb(); // та самая функция, которая запускает путем передачи любых данных на клиенте третий аргумент emit-a "message" (функцию)
        });

        socket.on('disconnect', function() {
            socket.broadcast.emit('leave', username);
        });

    });

    return io;
};
