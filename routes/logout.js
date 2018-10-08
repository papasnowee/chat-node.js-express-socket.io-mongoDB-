var sessionStore = require('lib/sessionStore');

exports.post = function(req, res, next) {
    var sid = req.session.id;

    var io = req.app.get('io');
    req.session.destroy(function (err) {


        var clients = io.clients(); // получаем все сокеты
        console.log(clients);

        for ( let client in clients ){ // ищем сокет для , которого произошел логаут и эмитим событие логаут для клиента, а также дисконнект для сервера
            if (client.handshake.session.id != sid) return;

            loadSession(sid, function (err, session) {
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
        }


        if (err) return next(err);

        res.redirect('/');
    });
};


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

