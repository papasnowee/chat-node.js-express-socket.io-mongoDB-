// запускаем и создаем базу с пользователями для тестов
var mongoose = require('lib/mongoose');
mongoose.set('debug', true);
var async = require('async');

async.series([   // функция , которая запускает функции из аргумента-массива по очереди = одну за другой = ждет пока первая вызовет колбэк, потом запускает вторую
    open,
    dropDatabase,
    // requireModels,
    createUsers
], function (err, results) { // в results попадает все, что вернули функции выше
    console.log(arguments);
    mongoose.disconnect();
    process.exit(err ? 255 : 0);  // если ошибка то exit code 255, иначе 0
});

function open(callback) {
    mongoose.connection.on('open', callback);
}

function dropDatabase(callback) {
    var db = mongoose.connection.db;
    db.dropDatabase(callback);
}

// function requireModels(callback) {  // в старой версии(вроде бы) нужно было для каждой модели запустить ensureIndexes что бы в базе нельзя было дублировать имена
//     require('models/user');

//     async.each(Object.keys(mongoose.models), function (modelName, callback) {
//         mongoose.models[modelName].ensureIndexes(callback);
//     }, callback);
// }

function createUsers(callback) {
    require('models/user'); // создаем индексы для новой базы

    var users = [
        {username: 'Вася', password: 'supervasya'},
        {username: 'Петя', password: '123'},
        {username: 'admin', password: 'thetruehero'}
    ];

    async.each(users, function (userData, callback) {
        var user = new mongoose.models.User(userData);
        user.save(callback);
    }, callback);
}


