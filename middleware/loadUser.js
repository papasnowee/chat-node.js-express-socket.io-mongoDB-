// данный модуль нужен что бы шаблоны имели достпук к переменным, например к объекту пользователя user( присваивается в res.locals.user)

var User = require('models/user').User;

module.exports = function(req, res, next) {
    req.user = res.locals.user = null; // если пользователь не зашел то юзер должен быть null, что бы в topNavogation.ejs выполнить if (user), что бы отрисовать "Войти" или "Выйти", дело в том, что при user== undefined , условие if(user) выдаст ошибку

    if (!req.session.user) return next();

    User.findById(req.session.user, function(err, user) {
        if (err) return next(err);

        req.user = res.locals.user = user; // теперь user станет виден во всех шаблонах, но зачем нужен req.user?
        next();
    });
};
