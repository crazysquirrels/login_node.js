var express = require('express')
    ,http = require('http')
    ,path = require('path');

var bodyParser = require('body-parser')
    ,static = require('serve-static')
    ,cookieParser = require('cookie-parser')
    ,errorHandler = require('error-handler');

var expressErrorHandler = require('express-error-handler');

var expressSession = require('express-session');

var mongoose = require('mongoose');

var crypto = require('crypto');

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

var UserSchema;

var UserModel;

function connectDB(){
    var databaseUrl = 'mongodb://localhost:27017/local';
    
    console.log('connecting to database');
    mongoose.Promise = global.Promise;
    mongoose.connect(databaseUrl);
    database = mongoose.connection;
    
    database.on('error', console.error.bind(console, 'mongoose connection error.'));
    database.on('open', function(){
        console.log('connected to database :' + databaseUrl);
        
        createUserSchema();
        
    });
    
    database.on('disconnected', function(){
        console.log('disconnected. reconnect to the database 5s later.');
        setInterval(connectDB, 5000);  
    });
    
}

function createUserSchema(){
        
    
    UserSchema = mongoose.Schema({
        id : {type: String, required: true, unique: true, 'default': ''},
        hashed_password : {type: String, required: true, 'default': ''},
        salt : {type: String, required: true},
        name : {type: String, index: 'hashed', 'default':''},
        age: {type: Number, 'default': -1},
	    created_at: {type: Date, index: {unique: false}, 'default': Date.now},
	    updated_at: {type: Date, index: {unique: false}, 'default': Date.now}
    });
    
    UserSchema
        .virtual('password')
        .set(function(password){
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
        console.log('set of virtual password - called: '+ this.hashed_password);
    })
        .get(function(){
        console.log('get of virtual password - called: ');
        return this._password;
    });
    
    UserSchema.method('encryptPassword', function(plainText, inSalt){
        if(inSalt) {
            return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex');
        } else {
			return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
		}
    });
    
    UserSchema.method('makeSalt', function(){
        return Math.round((new Date().valueOf()*Math.random())) + '';
    });
    
    UserSchema.method('authenticate', function(plainText, inSalt, hashed_password){
        if(inSalt){
            console.log('authenticate - called : %s -> %s : %s', plainText, this.encrytPassword(plainText, inSalt), hashed_password);
            return this.encrytPassword(plainText, inSalt) === hashed_password;
        }else {
            console.log('authenticate - called : %s -> %s : %s', plainText, this.encrytPassword(plainText, inSalt), hashed_password);
            return this.encrytPassword(plainText) === this.hashed_password;
        }
    });
    
    var validatePresenceOf = function(value){
        return value && value.length;
    };
    
    UserSchema.pre('save', function(next){
        if(!this.isNew) return next();
        
        if(!validatePresenceOf(this.password)) {
            next(new Error('invalid password'));
        }else {
            next();
        }
    })
    
    UserSchema.path('id').validate(function(id){
        return id.length;
    }, 'no column of id');
    
    UserSchema.path('name').validate(function(name){
        return name.length;
    }, 'no column of name');
    
    UserSchema.path('hashed_password').validate(function(hashed_password){
        return hashed_password.length;
    }, 'no column of hashed_password');
        
    UserSchema.static('findByID', function(id, callback){
        return this.find({id: id}, callback);
    });
    
    UserSchema.static('findAll', function(callback){
        return this.find({}, callback);
    });
    
    console.log('UserSchema definded');
 	
    UserModel = mongoose.model("users3", UserSchema);
	console.log('users3 definded.');   

}
    
var router = express.Router();

router.route('/process/login').post(function(req, res){
    console.log('/process/login - called');
    
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    
    console.log('login information :' +'<ID>' +paramId + '<PW>'+ paramPassword);
    
    if(database) {
        authUser(database, paramId, paramPassword, function(err, docs){
            if(err) {
                console.error('error found as processing login :' +err.stack);
                res.writeHead('200', {'Content-Type': 'text/html; charset=utf-8'});
                res.write('<p>' +err.stack +'</p>');
                res.end();
                
                return;
            }
            
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

router.route('/process/adduser').post(function(req, res){
    console.log('/process/adduser - called');
    
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
    
    console.log('request parameter : ' + paramId + ',' + paramPassword + ',' + paramName); 
    
    if(database) {
        addUser(database, paramId, paramPassword, paramName, function(err, addedUser){
            
            if(err) {
                console.error('error found as adding user :' +err.stack);
                res.writeHead('200', {'Content-Type': 'text/html; charset=utf-8'});
                res.write('<p>' +err.stack +'</p>');
                res.end();
                
                return;
            }
            
            if(addedUser){
                console.dir(addedUser);
        
                res.writeHead('200', {'Content-Type' : 'text/html; charset = utf-8'});
                res.write('<h2>New user added</h2>')
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

router.route('/process/listuser').post(function(req, res){
    console.log('/process/listuser' -called);
    
    if(database) {
        
        UserModel.findAll(function(err, results){
            if(err){
                console.error('error founed: ' +err.stack);
                
                res.writeHead('200', {'Content-Type': 'text/html; charset= utf-8'});
                res.write('<h1>error found as querying ID<h1>');
                res.write('<p>+err.stack+</p>');
                res.end();
                
                return;
            }
            
            if(results){
                console.dir(results);
                
                res.writeHead('200', {'Content-Type': 'text/html; charset= utf-8'});
                res.write('<h1>Users list<h1>');
                res.write('<div><ul>');
              
                for(var i = 0; i < results.length; i++) {
                    var curId = results[i]._docs.id;
                    var curName = results[i]._docs.name;
                    res.write('<li>#' + i + ' : ' + curId + ', ' + curName + '</li>');
                    res.write('</ul></div>');
				    res.end();
                }
                
            }else{
                
                res.writeHead('200', {'Content-Type': 'text/html; charset= utf-8'});
                res.write('<h1>Users list<h1>');
                res.end();
            }
        });
        
    }else{
                res.writeHead('200', {'Content-Type': 'text/html; charset= utf-8'});
                res.write('<h1>Failed connecting database<h1>');
                res.end();       
    }
});

app.post('/process/updateuser', function(req, res){
    console.log('/process/updateuser - called');
    
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
    
    console.log('requested parameter :'+ paramId + ',' +paramPassword + ',' + paramName);
    
    if(database){
        updateUser(database, paramId, paramPassword, paramName, function(err, result){
            
            if(err) { throw err;}
                
            if(result && result.modifiedCount >0 ){
                console.dir(result);
                
                res.writeHead('200', {'Content-Type' : 'text/html; charset = utf-8'});
                res.write('<h2>failed modifying user info</h2>');
                res.end();
            }
        });
    }else {
        res.writeHead('200', 'Content-type; charset =utf-8');
        res.write('<h2>failed connecting database</h2>');
        res.end();
    }
});

app.use('/', router);

var authUser = function(database, id, password, callback) {
    console.log('authUser -called');
    
    UserModel.findByID(id, function(err, results){
        if(err){
            callback(err, null);
            return;
        }
        
        console.log('result // search User with ID :', id);
        
        if(results.length > 0){
            console.log('User founded - mathched with input ID');
              
            if(results[0]._docs.password ==password){
                console.log('password matched');
                callback(null, results);
            }else {
                console.log('password not matched');
                callback(null, null);
            }
        }else {
            console.log('ID not matched');
            callback(null, null);
        }
    });
    
}

var addUser = function(database, id, password, name, callback){
    console.log('addUser - called : ' + id + ',' +password + 'name');
    
    var user = new UserModel({"id" : id, "password" : password, "name" : name});
    
    user.save(function(err){
        if(err){
            callback(err, null);
            return;
        }
        
        console.log('user added');
        callback(null, user);
    });
};

var updateUser = function(database, id, password, name, callback){
    console.log('updated user - called' + id +','+ password +',' +name);
    
    var users = database.collection('users');
    
    users.updateOne({"id" :id, "password": password, "name": name}, function(err, result){
        if(err){
            
            callback(err, null);
            return;
        }
        
        if(result.modifiedCount > 0){
            console.log('uer record - modified' + result.modifiedCount);
        }else{
            console.log('no record modified');
        }
        
        callback(null, result);
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
    
    if(database){
        database.colse();
    }
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));

    connectDB();

});



