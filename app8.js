var express = require('express')
    ,http = require('http')
    ,path = require('path');

var bodyParser = require('body-parser')
    ,static = require('serve-static')
    ,cookieParser = require('cookie-parser')
    ,errorHandler = require('error-handler');

var expressErrorHandler = require('express-error-handler');

var expressSession = require('express-session');

var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit : 10,
    host : 'localhost',
    user: 'root',
    password: 'Sarang0225&',
    database : 'test',
    debug : false
});

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

    
var router = express.Router();

router.route('/process/login').post(function(req, res){
    console.log('/process/login - called');
    
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    
    console.log('login information :' +'<ID>' +paramId + '<PW>'+ paramPassword);
    
    if(pool) {
        authUser(paramId, paramPassword, function(err, rows){
                    
                    if(err){
                        
                        console.error('error found as processing login :' +err.stack);
                        res.writeHead('200', {'Content-Type': 'text/html; charset=utf-8'});
                        res.write('<p>' +err.stack +'</p>');
                        res.end();
                        return;
                    }
                    
                    if(rows) {
                    console.dir(rows);

                    var name = rows[0].name;

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
        
router.route('/process/adduser').post(function(req, res){
    console.log('/process/adduser - called');
    
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
    var paramAge = req.body.age || req.query.age;
    
    console.log('request parameter : ' + paramId + ',' + paramPassword + ',' + paramName + ', ' +paramAge); 
    
    if(pool) {
        addUser(paramId, paramName, paramAge, paramPassword, function(err, addedUser){
            
            if(err) {
                console.error('error found as adding user :' +err.stack);
                res.writeHead('200', {'Content-Type': 'text/html; charset=utf-8'});
                res.write('<p>' +err.stack +'</p>');
                res.end();
                
                return;
            }
            
            if(addedUser){
                console.dir(addedUser);
        
                console.log('inserted' + addedUser.affetedRows + 'rows');
                
            var insertedId = addedUser.inserteId;
                console.log('ID added to record: '+ insertedId);
                res.writeHead('200', {'Content-Type' : 'text/html; charset = utf-8'});
                res.write('<h2>new user added</h2>');
                res.end();
            }else{
                
                res.writeHead('200', {'Content-Type' : 'text/html; charset = utf-8'});
                res.write('<h2>Failed to add new user</h2>');
                res.end();
            }
        });
    }else {
        res.writeHead('200', {'Content-Type' : charset = utf-8});
        res.write('<h2>Failed connecting database</h2>');
        res.end();
    }
});

app.use('/', router);

var authUser = function(id, password, callback) {
    console.log('authUser -called' + id + ',' + password);
    
        pool.getConnection(function(err, conn){
        if(err){
            if(conn){
                conn.release();
            }
            callback(err, null);
            return;
        }
        console.log('Thread ID connecting to database : '+conn.threadId);
        
        var columns = ['id', 'name', 'age'];
        var tablename = 'users';
        
        var exec = conn.query("select ?? from ?? where id = ? and password = ?", [columns, tablename, id, password], function(err, rows){
            conn.release();
            console.log('execution target SQL :' +exec.sql);
            
            if(rows.length > 0) {
                console.log('Found a User whose id[%s], password[%s] are matched : ' , id, password);
                callback(null, rows);
            }else {
                console.log('Cannot find the user with input ID/PW');
                callback(null, null);
            }
        });
            conn.on('error', function(err){
                console.log('Errors occured as connecting database');
                console.dir(err);
                
                callback(err, null);
            });
            
        });
        
}

var addUser = function(id, name, age, password, callback) {
    console.log('addUser called : ' +id + ', ' +password + ', ' + name + ', ' + age);
    
    pool.getConnection(function(err, conn){
        if(err){
            if(conn){
                conn.release();
            }
            
            callback(err, null);   
            return;
        }
        
        console.log('Database connecting Thread ID :' + conn.threadId);
        
        var data = {id:id, name:name, age:age, password:password};
        
        var exec = conn.query('insert into users set ?', data, function(err, result){
            conn.release();
            console.log('execution targer SQL: ' +exec.sql);
            
            if(err){
                console.log('Errors occured as connecting database');
                console.dir(err);
                
                callback(err, null);
                return;
            }
            
            callback(null, result);
        });
        
        conn.on('error', function(err){
            console.log('Error occured');
            console.dir(err);
            
            callback(err, null);
        });
    
    });
}
    
var errorHandler = expressErrorHandler({
    static: {
        '404' : './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

process.on('SIGTERM', function(){
    console.log('ending process');
    app.close();
});

app.on('close', function(){
    console.log('express server in ending');

});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));

});



