var path = require('path');
var fs = require('fs');
var url = require('url');
var query = require("querystring");	

var tostring = Object.prototype.toString;
var arr = [];

var helper = {
    //tool base
    slice: arr.slice,
    join: arr.join,
    type: function (obj) {
        switch(tostring.call(obj)){
            case '[object Object]': return 'object';
            case '[object Number]': return 'number';
            case '[object String]': return 'string';
            case '[object Function]': return 'function';
            case '[object Array]': return 'array';
            case '[object Boolean]': return 'bool';
        }
    },
    isFunction: function (obj) {
        return this.type(obj) === 'function';
    },
    isArray: function (obj) {
        return this.type(obj) === 'array';
    },

    //tool base
    each: function (obj, callback) {
        var i = 0, name, length = obj.length;
        if (this.isArray(obj)) {
            for (; i < length; ) {
                if (callback.call(obj[i], i, obj[i++]) === false) break;
            }
        } else {
            for (name in obj) {
                if (callback.call(obj[name], name, obj[name]) === false) break;
            }
        }
    },

    //tool obj
    extend: function (target) {
        var args = this.slice.call(arguments, 1);
        target = target || {};
        this.each(args, function (i, item) {
            if(item){
                helper.each(item, function (k, v) {
                    if (item.hasOwnProperty(k)) {
                        target[k] = v;
                    }
                });
            }
        });
        return target;
    },

    //tool stringreplacer: (function () {
    replacer: (function () {
        var replacer_reg = /\{\s*([^\}]*)\s*\}/g;

        return function (temp, datas, callback) {
            var html;
            if (!temp) return;
            if (!datas) return temp;
            if (window.XT && XT && XT.linq && datas instanceof XT.linq) datas = datas.array();
            if (!this.isArray(datas)) datas = [datas];
            if (!this.isFunction(callback)) callback = function (data, m) {
                return data[m] === undefined ?
                    typeof data === 'string' || typeof data === 'number' ? data : ''
                    :
                    data[m];
            };
            html = [];
            this.each(datas, function (i, data) {
                html.push(temp.replace(replacer_reg, function (idx, m) {
                    return callback(data, m);
                }));
            });
            return html.join('');
        }
    })(),

    //tool Math
    random: function (max) {
        return Math.round(Math.random() * (max || 1));
    },

    //response base
    getMIME: (function(){
        var mimeNames = {
            ".css": "text/css",
            ".html": "text/html",
            ".js": "text/javascript",
            ".txt": "text/plain",

            ".ttf": "application/x-font-ttf",
            ".woff": "application/x-font-woff",
            ".woff2": "application/x-font-woff2",

            ".mp3": "audio/mpeg",
            ".mp4": "video/mp4",
            ".ogg": "application/ogg", 
            ".ogv": "video/ogg", 
            ".oga": "audio/ogg",
            ".wav": "audio/x-wav",
            ".webm": "video/webm",

            ".jpeg": "image/jpeg",
            ".jpg": "image/jpg",
            ".bmp": "image/bmp",
            ".gif": "image/gif",
            ".png": "image/png"
        };
        
        return function(filePath){
            var ext = path.extname(url.parse(filePath).pathname);
            return mimeNames[ext] || 'application/octet-stream';
        }
    })(),

    //request data
    getParams: function (request, callback) {
        var params;
        var done = function () {
            if(helper.isFunction(callback)) callback(params);
        }
        if(request.method === "GET"){
            params = url.parse(request.url, true).query;
            done();
        }else{
            var postdata = "";
            request.addListener("data", function(postchunk){
                postdata += postchunk;
            });
            
            request.addListener("end",function(){
                params = query.parse(postdata);
                done();
            });
        }
    }
};

helper.loadFile = function (filePath, callback) {
    var filepath = path.join(__dirname, url.parse(filePath).pathname);
    var done = function (err, data) {
        if(helper.isFunction(callback)) callback(err, data);
    }
    if (!fs.existsSync(filepath)) {
        done('file not exists');
    }

    fs.readFile(filepath, (err, data) => {
        if(err) console.log(err);
        done(err, data);
    });
}

helper.log = (function () {
    var _path = path.join(__dirname, '/log');

    fs.stat(_path, (err, stats) => {
        if(!stats) 
            fs.mkdir(_path, err => {
                if(err) throw err;
            })
    });

    return function () {
        var date = new Date();
        var message = date.toISOString() + ': ' + helper.join.call(arguments,',  ');
        console.log(message);
        fs.appendFile(path.join(_path, date.toDateString() + '.txt'), message + '\r\n', err => {
            if(err) throw err;
        });
    }
})()

module.exports = helper;