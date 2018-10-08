var mongoose = require('mongoose');
var express = require('express');
var MongoStore = require('connect-mongo')(express); // модуль нужен , что бы хранить сессии в базе данных монгоДБ, к нему будет
// обращаться миддлвер session что бы сохранять/загружать сессии.

var sessionStore = new MongoStore({mongooseConnection: mongoose.connection});

module.exports = sessionStore;