var mongodb = require('mongodb');
var mongoose = require('mongoose');

var database;
var UserSchema;
var UserModel;

function connectDB(){
    var databaseUrl = 'mongodb://localhost:27017/local';
    
    mongoose.connect(databaseUrl);
    database = mongoose.connection;
    
    database.on('error', console.error.bind(console, 'mongoose connection error'));
    database.on('open', function(){
        console.log('connected to database :' + databaseUrl);
        
        createUserSchema();
        
        doTest();
        
    });
    
    database.on('disconnected', connectDB);
}

function createUserSchema(){
        
    
    UserSchema = mongoose.Schema({
        id : {type: String, required: true, unique: true},
        name : {type: String, index: 'hashed', 'default':''},
        age: {type: Number, 'default': -1},
	    created_at: {type: Date, index: {unique: false}, 'default': Date.now},
	    updated_at: {type: Date, index: {unique: false}, 'default': Date.now}
    });
    
    UserSchema
        .virtual('info')
        .set(function(info){
        var splitted = info.split(' ');
        this.id = splitted[0];
        this.name = splitted[1];
        console.log('virtual info - set :%s, %s', this.id, this.name);
    })
    
    .get(function(){ return this.id + ' ' + this.name});
    
    console.log('UserSchema');
    
    UserModel = mongoose.model('users4', UserSchema);
    console.log('UserModel');
    
}


function doTest(){
    var user = new UserModel({"info": 'test01 GirlsGeneration'});
    
    user.save(function(err){
        if(err){throw err;}
        
        console.log('user data added');
        
        findAll();
    });
        console.log('assinged value to info property');
        console.log('id: %s, name: %s', user.id, user.name);
}

function findAll(){
    UserModel.find({}, function(err, results){
        if(err){throw err;}
        
        if(results){
            console.log('inquired user documents object #0 -> id: %s, name: %s', results[0]._docs.id, results[0]._docs.name);
        }
    });
}

connectDB();