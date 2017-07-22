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

var cors = require('cors');

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

app.use(cors);

var storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, 'uploads')
    },
    filename: function(req, file, callback){
        callback(null, file.originalname + Date.now())
    }
});

var upload = multer({
    storage: storage,
    limits: {
        files: 10,
        fileSize: 1024*1024*1024
    }
});

var router = express.Router();

router.route('/process/download').get(function(req, res) {
	console.log('/process/download -called');
	
	try {
		var paramFilepath = req.param('filepath');
		var filepath = __dirname + paramFilepath;
		var filename = path.basename(paramFilepath);
        var mimetype = mime.lookup(paramFilepath);
		
		console.log('file path : ' + filepath);
		console.log('file name : ' + filename);
		console.log('MIME type : ' + mimetype);
		
		var stats = fs.statSync(filepath);
		var fileSize = stats["size"];
		console.log('file size : ' + fileSize);
		
		res.setHeader('Content-disposition', 'attachment; filename=' + filename);
	    res.setHeader('Content-type', mimetype);
	    res.setHeader('Content-Length', fileSize);
	  
	    var filestream = fs.createReadStream(filepath);
	    filestream.pipe(res);
	    
	} catch(err) {
		console.dir(err.stack);
		
		res.writeHead('400', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h3>íŒŒì¼ ë‹¤ìš´ë¡œë“œ ì‹¤íŒ¨</h3>');
		res.end();
	}	
		
});


router.route('/process/photo').post(upload.array('photo', 1), function(req, res){
    console.log('/process/photo - called');
    
    try {
        var files = req.files;
        
        console.dir('#=====information of the first uploaded======#');
        console.dir(req.files[0]);
        console.dir('#=====#');
        
        var originalname = '',
			filename = '',
			mimetype = '',
			size = 0;
		if (Array.isArray(files)) {
	        console.log("the number of files in the array : %d", files.length);
	        
	        for (var index = 0; index < files.length; index++) {
	        	originalname = files[index].originalname;
	        	filename = files[index].filename;
	        	mimetype = files[index].mimetype;
	        	size = files[index].size;
	        }
    }else {
        console.log('the number of files : 1');
        
        originalname = files[index].originalname;
        filename = files[index].name;
        mimetype = files[index].mimetype;
        size = files[index].size;
    }
        
        console.log('current file : ' +originalname + "," + filename + "," + mimetype + "," + size);
        
        res.writeHead('200', {'Content-Type':'tappext/html;charset=utf8'});
		res.write('<h3>File sucessfully uploaded</h3>');
		res.write('<hr/>');
		res.write('<p>original file : ' + originalname + ' -> saved file ' + filename + '</p>');
		res.write('<p>MIME TYPE : ' + mimetype + '</p>');
		res.write('<p>file size: ' + size + '</p>');
		res.end();
        
    }catch(err) {
        console.dir(err.stack);
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