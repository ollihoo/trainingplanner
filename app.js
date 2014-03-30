var express = require('express');
var passport = require('passport');
var mongo = require('mongodb');
var monk = require('monk');

var routes = require('./routes'),
    personalroutes = require('./routes/personalized');
var BasicStrategy = require('passport-http').BasicStrategy,
    DigestStrategy = require('passport-http').DigestStrategy;

var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// render view
app.engine('html', require('ejs').renderFile);

// mongo connection
var db = monk('172.16.16.111:27017/training');

// basic authentication
passport.use(new BasicStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!user.validPassword(password)) { return done(null, false); }
            return done(null, user);
        });
    }
));

passport.use(new DigestStrategy({ qop: 'auth' },
    function(username, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            return done(null, user, user.password);
        });
    },
    function(params, done) {
        // validate nonces as necessary
        done(null, true)
    }
));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/my/home', passport.authenticate('digest', { session: false }), personalroutes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
