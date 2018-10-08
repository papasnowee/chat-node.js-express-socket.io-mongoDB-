var crypto = require('crypto');
var async =  require('async');

var mongoose = require('lib/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

schema.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

schema.virtual('password')
    .set(function(password) {
        this._plainPassword = password;
        this.salt = Math.random() + '';
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function () { return this._plainPassword; });


schema.methods.checkPassword = function (password) {
    return this.encryptPassword(password) === this.hashedPassword;
};

schema.statics.authorize = function (username, password, callback) {
    var User = this; // когда такой метов запустится, то модель User ( mongoose.model('User', schema) ) будет this

    // если постетитель найден, то сверяем пароль с user.checkPassword ( в папке models/user.js назначается метод schema.methods.checkPassword)\
    //Если не найден - создаем нового пользователя.
    //Авторизация успешна? Да - сохраняем _id посетителя в сессии: session.user = user._id и ответить 200
    // Не успешна - вывести ошибку


    async.waterfall([
        function (callback) {
            User.findOne({username: username}, callback);
        },
        function (user, callback) {
            if (user) {
                if (user.checkPassword(password)) {
                    callback(null, user);
                } else {
                    callback( new AuthError("Пароль неверен"));
                }
            } else {
                var user = new User({username: username, password: password});
                user.save(function (err) {
                    if (err) return callback(err);
                    callback(null, user);
                });
            }
        }
    ], callback);
};

exports.User = mongoose.model('User', schema);

class AuthError extends Error {
    constructor(message) {
        super();
        Error.apply(this, arguments);
        Error.captureStackTrace(this, AuthError); // теперь в свойстве stack будет стек вызовов до(исключая) AuthError

        this.message = message;
    }
}

AuthError.prototype.name = 'AuthError';

exports.AuthError = AuthError;


