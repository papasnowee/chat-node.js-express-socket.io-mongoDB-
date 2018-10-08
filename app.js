var express = require('express');
var path = require('path');
var http = require('http');
var config = require('config');
var cookieParser = require('cookie-parser');
// var log = require('lib/log')(module);  // winston не работает , т.к. транспорты устарели, надо разобраться

var mongoose = require('lib/mongoose');
var HttpError = require('error').HttpError;

var app = express();

app.use(cookieParser());

app.engine('ejs', require('ejs-locals')); // (layout partial block). Строка говорит ноде: Файлы ejs следует обрабатывать движком ejs-locals
app.set('views', __dirname + '/views'); // путь до папки шаблонов

app.set('view engine', 'ejs'); //устанавливаем систему шаблонизации ejs

app.use(express.favicon()); // /favicon.ico - если url такой, то експресс читает фавиконку и выдает, а иначе передает управление дальше
if (app.get('env') == 'development') {
    app.use(express.logger('dev')); // connect logger - там смотреть форматы, dev это формат логгирования,
    // logger выводит запись о том, что у нас за запрос пришел
} else {
    app.use(express.logger('default'));
}

app.use(express.bodyParser());  //считвает пост json и прочее - разбирает тело запроса. Данные ставновятся доступны через req.body.имяСвойства

//app.use(express.cookieParser()); // req.cookies( кукис это заголовок(хедер) запроса)

var sessionStore = require('lib/sessionStore');

app.use(express.session({
    secret: config.get('session:secret'),
    key: config.get('session:key'),
    cookie: config.get('session:cookie'),
    store: sessionStore // тут хранится сессия
}));

// app.use(function (req, res, next) {
//     req.session.numberOfVisits = req.session.numberOfVisits + 1 || 1;  // req.session объект, в который можно записать свойства
//     // и они автоматически сохранятся, когда этот запрос будет завершен. Когда посеститель заходит, он получает либо новую сессию,
//     // либо восстанавливается старая по идентификатору и эта сессия записывается в req.session.
//     // сохраняет в db.sessions в монго. Что бы посмотреть сохраненные сессии нужно запустить .\mongo chat --> db.sessions.find()
//     res.send("Visits: " + req.session.numberOfVisits);
// });

app.use(require('middleware/loadUser')); // данный миддлвер вставлять необходимо после сессии и перед роутом
app.use(require('middleware/sendHttpError'));

app.use(app.router); // в папке routes вроде как должен лежать модуль для обработки url-ов

require('routes')(app);

app.use(express.static(path.join(__dirname, 'public'))); // теперь файл с указанным путем будет искаться в папке 'public',
// а модуль path просто склеивает через "/" аргументы(строки) в один путь

app.use(function(err, req, res, next) {
    if (typeof err == 'number') {
        err = new HttpError(err);
    }

    if (err instanceof HttpError) {
        res.sendHttpError(err);
    } else {
        if (app.get('env') == 'development') {
            console.log(123);
            console.log(err.message);
            express.errorHandler(err, req, res, next);
        } else {
            console.log(err.message);
            // log.error(err);  лог не работает
            err = new HttpError(500);
            res.sendHttpError(err);
        }
    }
});


var server = http.createServer(app);
server.listen(config.get('port'), function(){
    console.log('Express server listening on port ' + config.get('port'));
});

var io = require('./socket')(server);
app.set('io', io); // делаем io глобальной переменной на уровне приложения app