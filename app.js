var express = require('express')
    ,http = require('http')
    ,path = require('path');

var bodyParser = require('body-parser')
    ,static = require('serve-static')
    ,cookieParser = require('cookie-parser')
    ,errorHandler = require('error-handler');

var expressErrorHandler = require('express-error-handler');

var expressSession = require('express-session');

var app = express();

app.set('port', process.env.PORT || 3000);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use('/public', static(path.join(__dirname, 'public')));
app.use('/uploads', static(path.join(__dirname, 'uploads')));

app.use(cookieParser());
app.use(expressSession({
    secret: 'my key',
    resave: true,
    saveUninitialized: true
}));

var MongoClient = require('mongodb').MongoClient;
var database;

function connectDB(){
    var databaseUrl = 'mongodb://localhost:27017/local';
    
    MongoClient.connect(databaseUrl, function(err, db){
        if(err) throw err;
        
        console.log('connected to Database: ' + databaseUrl);
        database =db;   
    
    });
}

var router = express.Router();

router.route('/process/login').post(function(req, res){
    console.log('/process/login - called');
    
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    
    console.log('login information :' +'<ID>' +paramId + '<PW>'+ paramPassword);
    
    if(database) {
        authUser(database, paramId, paramPassword, function(err, docs){
            if(err) {throw err;}
            
            if(docs) {
                console.dir(docs);
                
                var name = docs[0].name;
                
                res.writeHead('200', {'Content-Type': 'text/html; charset=utf-8'});
                res.write('<h1>Sucessfully logged in</h1>');
                res.write('<div><p>Param Id :' +paramId+ '</p></div>');
                res.write('<div><p>Param Password :' +username+ '</p></div>');
                res.write("<br><br><a href='/public/login.html'>Back to Login page</a>");
                res.end();
            } else
                res.writeHead('200', {'Content-Type' : 'text/html; charset =utf-8'});
                res.write('<h2>Failled to login in</h2>')
                res.write('<div><p>Please check your ID/PW</p></div>');
                res.write("<br><br><a href='/public/login.html'>Back to Login page</a>");
                res.end();
            });
    }else {
                res.writeHead('200', {'Content-Type' : 'text/html; charset =utf-8'});
                res.write('<h2>Failed connecting Database</h2>')
                res.write("<div><p>Cannot connect to Database</p></div>");
                res.end();
    }
});

app.use('/', router);

var authUser = function(database, id, password, callback) {
    console.log('authUser -called');
    
    var users = database.collection('users');
    
    users.find({"id" : id, "password" : password}).toArray(function(err, docs) {
        if(err) {
            callback(err, null);
            return;
        }
        
        if(docs.length > 0){
            console.log('Found the user matching ID/PW', id, password);
            callback(null, docs);
    
        }else {
            console.log('No user with input ID/PW');
            callback(null, null);
        }
    });
    
}

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

    connectDB();

});

