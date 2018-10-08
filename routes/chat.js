exports.get = function (req, res) {
    console.log("chat.js cookie == " + JSON.stringify(req.cookies));
    res.render('chat');
};