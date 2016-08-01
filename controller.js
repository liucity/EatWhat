
var url = require('url');
var helper = require('./helper');
var sqlite = require('sqlite3').verbose();

var routeRegister = {
    '/': function (request, response) {
        helper.loadFile('/index.html', function (err, data) {
            response.writeHead(200, {
                'Content-Type': 'text/html'
            });
            response.end(data);
        });
    }
}

var jsonRegister = {
    '/random': function (request, response, params, jsonResult) {
        var list = JSON.parse(params['data'] || '[]');
        var random = Math.random();
        var temp = 0;
        helper.each(list, function(i, item){
            if(temp < random && (temp += item.share / item.total) > random){
                random = i;
                return false;
            }
        })
        var result = list[random];
        
        dbhelper.run('UPDATE dinners SET ate = ate + 1 WHERE id=$id', { $id: result.id }, function (err, rows) {
            jsonResult(err, result);
        });
    },
    '/query': function (request, response, params, jsonResult) {
        dbhelper.find(params, function (result) {
            jsonResult(null, result);
        });
    },
    '/add': function (request, response, params, jsonResult) {
        var obj = JSON.parse(params['data'] || '{}');
        dbhelper.find({ 'tab': obj.tab, 'name': obj.name }, function (result) {
            if(!result.length){
                dbhelper.add(obj, function (result) {
                    jsonResult(null, result);
                })
            }else{
                jsonResult('name exists!');
            }
        });
    },
    '/xx': function (request, response, params, jsonResult) {
        var obj = JSON.parse(params['data'] || '{}');
        dbhelper.run('UPDATE dinners SET xx = xx + 1 WHERE id=$id', { $id: obj.id }, function (err, rows) {
            jsonResult(err, !err);
        });
    },
    '/oo': function (request, response, params, jsonResult) {
        var obj = JSON.parse(params['data'] || '{}');
        dbhelper.run('UPDATE dinners SET oo = oo + 1 WHERE id=$id', { $id: obj.id }, function (err, rows) {
            jsonResult(err, !err);
        });
    },
    '/clean': function (request, response, params, jsonResult) {
        dbhelper.delete(params, function (err, rows) {
            jsonResult(err, !err);
        })
    }
}

var dbhelper = {
    cache: {},
    inited: false,
    name: 'test.db',
    promise: function (callback) {
        this.__promise = (this.__promise || new Promise(function (resolve, reject) {
            resolve();
        })).then(function(value){
            var rst = callback(value);
            return rst;
        })
        return this;
    },
    db: function () {
        return this.promise(function(){
            var _db = new sqlite.Database(dbhelper.name, err => {
                if(err) throw err;
                if(!dbhelper.inited){
                    // _db.run("DROP TABLE IF EXISTS dinners");
                    _db.run("CREATE TABLE IF NOT EXISTS dinners (id integer PRIMARY KEY autoincrement, tab nvarchar(100), name nvarchar(100), color varchar(20), ate int, oo int, xx int)");
                    dbhelper.inited = true;
                }
            });
            return _db;
        })
    },
    add: function (obj, callback) {
        this.db().promise(function (db) {
            var stmt = db.prepare("INSERT INTO dinners (tab, name, color, ate, oo, xx) VALUES (?, ?, ?, 0, 0, 0)");
            stmt.run(obj.tab || '', obj.name || '', obj.color || '');
            stmt.finalize();
            db.close();
            if(helper.isFunction(callback)) callback([]);
        });
    },
    find: function (query, callback) {
        this.all("SELECT * FROM dinners WHERE " + (this.getWhere(query) || '1=1'), this.getParams(query), function(err, rows) {
                if(helper.isFunction(callback)) callback(rows || []);
            });
    },
    update: function (query, obj, callback) {
        this.run('UPDATE dinners SET ' + (this.getWhere(obj) || '1=1') + ' WHERE ' + (this.getWhere(query) || '1=1'), 
            this.getParams(helper.extend({}, obj, query)), function(err, rows) {
                if(helper.isFunction(callback)) callback(rows || []);
            });
    },
    delete: function (query, callback) {
        this.run('DELETE FROM dinners WHERE '+ (this.getWhere(query) || '1=1'), this.getParams(query), function(err, rows){
                if(helper.isFunction(callback)) callback(err, rows);
            });
    },
    getWhere: function (params) {
        var where = [];
        helper.each(params || {}, function (k, v) {
            if(v) {
                where.push(k + "=$" + k);
            }
        })
        return where.join(' AND ') || '';
    },
    getParams: function (params) {
        var pars = {};
        helper.each(params || {}, function (k, v) {
            if(v) {
                pars["$" + k] = v;
            }
        })
        return pars;
    },
    run: function (sql, params, callback) {
        return this.db().promise(function(db){
            return new Promise(function(resolve, reject){
                db.run(sql, params, function(err, rows){
                    err ? reject(err) : resolve(rows) & (helper.isFunction(callback) && callback(err, rows));
                });
            }).then(function(){
                db.close();
            }).catch(function(err){
                console.log(err);
            });
        });
    },
    all: function(sql, params, callback){
        return this.db().promise(function(db){
            return new Promise(function(resolve, reject){
                db.all(sql, params, function(err, rows){
                    err ? reject(err) : resolve(rows) & (helper.isFunction(callback) && callback(err, rows));
                });
            }).then(function(){
                db.close();
            }).catch(function(err){
                console.log(err);
            });
        });
    }
}

module.exports = function (request, response) {
    var _url = url.parse(request.url);
    
    helper.log('handleRequest', _url.pathname);
    
    if(helper.isFunction(routeRegister[_url.pathname])){
        routeRegister[_url.pathname](request, response);
    }else if (helper.isFunction(jsonRegister[_url.pathname])){
        helper.getParams(request, function (params) {
            helper.log('params', JSON.stringify(params));
            jsonRegister[_url.pathname](request, response, params, function (err, data) {
                if(err){
                    response.writeHead(400);
                    response.end(err.message || JSON.stringify(err));
                }else{
                    response.writeHead(200, {
                        'Content-Type': 'text/json; charset=UTF-8'
                    });
                    response.end(JSON.stringify(data));
                }
            });
        });
    }else{
        response.end();
    }
}