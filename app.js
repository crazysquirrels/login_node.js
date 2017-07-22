var express = require('express')
    ,http = require('http')
    ,path = require('path');

var bodyParser = require('body-parser')
    ,static = require('serve-static')
    ,cookieParser = require('cookie-parser')
    ,errorHandler = require('error-handler');

var expressErrorHandler = require('express-error-handler');

var expressSession = require('express-session');

var multer = require('multer');
var fs = require('fs');

var cors = require(cors);

var app = express();

app.set('port', process.env.PORT || 3000);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use('/public', static(path.join(__dirname, 'public')));
app.use('/uploads', static(path.join(__dirname, 'uploads')));

app.use(cookieParser());
app.use(expressionSession({
    secret: 'my key',
    resave: true,
    saveUninitialized: true
}));

var router = express.Router();

router.route('/process/login').post(function(req, res){
    console.log('/process/login processed');
    
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    
    if(req.session.user){
        console.log('move to login page - already logged in');
        
        res.redirect('/public/product.html');
    }else{
        req.session.user = {
            id: paramId,
            name: 'girls generation',
            authorized: true
        };
        
        res.writeHead('200', {'Content-Type': 'text/html; chatset=utf-8'});
        res.write('<h1>Express Server</h1>');
        res.write('<div><p>Param Id :' +paramId+ '</p></div>');
        res.write('<div><p>Param Password :' +paramPassword+ '</p></div>');
        res.write("<br><br><a href='/public/login.html'>Back to Login page</a>");
        res.end();
        
    }
    
});

router.route('/process/logout').get(function(req, res){
    console.log('/process/logout - called');
    
    if(req.session.user){
        console.log('proceed to logout');
        
        req.session.destroy(function(err){
            if(err){throw err;}
            
            console.log('session deleted and logged out');
            res.redirect('/public/login.html');
        });
    }else{
        
        console.log('need to be logged in');
        res.redirect('/public/login.html');
    }
});

router.route('process/product').get(function(req, res){
    console.log('/process/product - called');
    
    if(req.session.user){
        res.redirect('/public/product.html');
    }else{
        res.redirect('/public/login.html');
    }
});

app.use('/', router);

app.all('*', function(req, res) {
	res.status(404).send('<h1>ERROR</h1>');
});

var errorHandler = expressErrorHandler({
    static: {
        '404' : './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});