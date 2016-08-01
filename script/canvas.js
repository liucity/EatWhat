;(function (global) {
    var arr = [];
    var tostring = Object.prototype.toString;
    
    var tool = {
        version: '0.0.1',
        slice: arr.slice,
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
        isObject: function (obj) {
            return this.type(obj) === 'object';
        },
        isArray: function (obj) {
            return this.type(obj) === 'array';
        },
        isFunction: function (obj) {
            return this.type(obj) === 'function';
        },
        isString: function (obj) {
            return this.type(obj) === 'string';
        },
        formatter: function (format) {
        },
        error: function (msg) {
            throw new Error(msg);
        },
        /*---------------------------------format string.  e.g. replacer('id_<%prop%>', { prop: '1'}) //id_1--------------------------*/
        replacer: (function () {
            var replacer_reg = /{\s*([^}]*)\s*}/g;

            return function (temp, datas, callback) {
                var html;
                var linq = window.linq || XT.linq;
                if (!temp) return;
                if (!datas) return temp;
                if (html && datas instanceof html) datas = datas.array();
                if (!$.isArray(datas)) datas = [datas];
                if (!$.isFunction(callback)) callback = function (data, m) {
                    return data[m] === undefined ?
                        typeof data === 'string' || typeof data === 'number' ? data : ''
                        :
                        data[m];
                };
                html = [];
                $.each(datas, function (i, data) {
                    html.push(temp.replace(replacer_reg, function (idx, m) {
                        return callback(data, m);
                    }));
                })
                return html.join('');
            }
        })()
    }
    
    tool.each = function (obj, callback) {
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
    }
    
    tool.extend = function (target) {
        var args = this.slice.call(arguments, 1);
        target = target || {};
        this.each(args, function (i, item) {
            if(item){
                tool.each(item, function (k, v) {
                    if (item.hasOwnProperty(k)) {
                        target[k] = v;
                    }
                });
            }
        });
        return target;
    }
    
    if(global.tool){
        if(global.tool.version){
            if (global.tool.version > tool.version){
                return false;
            }
        }else{
            tool.error('there contains another tool');
        }
    }
    global.tool = tool;
})(window.XT = window.XT || {});


;(function(global){
    "use strict";

    var tostring = Object.prototype.toString,
        slice = [].slice,
        splice = [].splice,
        push = [].push,
        isArray = function (obj) {
            return Array.isArray(obj);
        },
        isFunction = function (obj) {
            return typeof obj === 'function';
        };

    var LinqArray = function (source) {
        if (!(this instanceof LinqArray)) {
            return new LinqArray(source);
        }
        if(tostring.call(source) === '[object Arguments]'){
            source = slice.call(source);
        } else if (source instanceof LinqArray) {
            source = source.array();
        }
        this.source = isArray(source) ? slice.call(source, 0) : [];
    };

    LinqArray.prototype = {
        each: function (callback, reverse) {
            var arr = this.source,
                l = arr.length,
                i = 0;

            if (reverse) {
                while (l--) {
                    if (callback.call(arr[l], arr[l], l) === false) break;
                }
            } else {
                for (; i < l; i++) {
                    if (callback.call(arr[i], arr[i], i) === false) break;
                }
            }
            return this;
        },
        add: function () {
            push.apply(this.source, arguments);
            return this;
        },
        insert: function (index) {
            var args = slice.call(arguments, 0);
            splice.call(args, 1, 0, 0);
            splice.apply(this.source, args);
            return this;
        },
        remove: function (callback) {
            var temp;
            if(typeof callback === 'number'){
                temp = callback;
                callback = function(item, i){
                    return i !== temp;
                }
            }
            return this.where(callback);
        },
        where: function (callback) {
            var result = new LinqArray();
            this.each(function (item, i) {
                if (callback.call(item, item, i)) {
                    result.add(item);
                }
            });
            return result;
        },
        first: function (callback) {
            var result;

            if (isFunction(callback)) {
                this.each(function (item, i) {
                    if (callback.call(item, item, i)) {
                        result = item;
                        return false;
                    }
                });
            } else {
                result = this.source[0];
            }
            return result;
        },
        last: function (callback) {
            var result;

            if (isFunction(callback)) {
                this.each(function (item, i) {
                    if (callback.call(item, item, i)) {
                        result = item;
                        return false;
                    }
                }, true);
            } else {
                result = this.source[this.source.length - 1];
            }
            return result;
        },
        take: function(count){
            return this.where(function(item, i){
                return i < count;
            });
        },
        select: function (callback) {
            var result = new LinqArray([]);
            this.each(function (item, i) {
                result.add(callback.call(item, item, i));
            });
            return result;
        },
        selectmany: function (callback) {
            var result = new LinqArray(),
                obj;
            this.each(function (item, i) {
                obj = callback.call(item, item, i);
                if(obj instanceof LinqArray){
                    result.add.apply(result, obj.source);
                }else if(obj !== undefined){
                    result.add[isArray(obj) ? 'apply' : 'call'](result, obj);
                }
            });
            return result;
        },
        selectall: function(){
            var results = this.clone();
            while(results.any(function(){
                return isArray(this);
            })){
                results = results.selectmany(function(){
                    return this;
                });
            }
            return results;
        },
        group: function (callback) {
            var map = {},
                result = new LinqArray(),
                key;

            this.each(function (item, i) {
                i = callback.call(item, item, i) || '';
                key = JSON.stringify(i);
                map[key] = map[key] || [];
                map[key].push(item);
            });

            for (key in map) {
                var list = new LinqArray(map[key]);
                list.key = JSON.parse(key);
                result.add(list);
            }

            return result;
        },
        unique: function (callback) {
            var map = {},
                result = new LinqArray(),
                key;

            callback = callback || function(item){ return item; }

            this.each(function (item, i) {
                i = callback.call(item, item, i) || '';
                key = JSON.stringify(i);
                map[key] = i;
            });
            for (key in map) {
                if(map[key]) result.add(map[key]);
            }
            return result;
        },
        max: function (callback) {
            var items = isFunction(callback) ? this.select(callback) : this;

            return Math.max.apply(null, items.selectmany(function (item) {
                return item;
            }).array());
        },
        min: function (callback) {
            var items = isFunction(callback) ? this.select(callback) : this;

            return Math.min.apply(null, items.selectmany(function (item) {
                return item;
            }).array());
        },
        sum: function(callback){
            var items = isFunction(callback) ? this.select(callback) : this;
            var result = 0;

            items.selectmany(function (item) {
                return item;
            }).each(function(item){
                if(!isNaN(item)){
                    result += Number(item);
                }
            })

            return result;
        },
        sort: function(callback){
            
            var args = new LinqArray(arguments),
                rights = this.each(function(){
                    this.__right = [];
                }),
                len, i;

            if(!args.count()){
                args.add(function(item){
                    return item;
                })
            }

            args.each(function(arg){
                if(isFunction(arg)){
                    rights.each(function(item, j){
                        this.__right.push(arg.call(item, item, j) || '');
                    })
                }else{
                    rights.each(function(item, j){
                        this.__right.push(item[arg] || '');
                    });
                }
            })

            rights.source.sort(function(a, b){
                i = 0;
                len = a.__right.length;
                while(i < len){
                    if(a.__right[i] > b.__right[i]) return 1;
                    i++;
                }
                return -1;
            });
            this.each(function(item, j){
                delete item.__right;
            });
            return this;
        },
        sortDesc: function(callback){
            var args = new LinqArray(arguments),
                rights = this.each(function(){
                    this.__right = [];
                }),
                len, i;

            if(!args.count()){
                args.add(function(item){
                    return item;
                })
            }

            args.each(function(arg){
                if(isFunction(arg)){
                    rights.each(function(item, j){
                        this.__right.push(arg.call(item, item, j) || '');
                    })
                }else{
                    rights.each(function(item, j){
                        this.__right.push(item[arg] || '');
                    });
                }
            })

            rights.source.sort(function(a, b){
                i = 0;
                len = a.__right.length;
                while(i < len){
                    if(a.__right[i] < b.__right[i]) return 1;
                    i++;
                }
                return -1;
            });
            this.each(function(item, j){
                delete item.__right;
            });
            return this;
        },
        reverse: function () {
            var result = new LinqArray([]);

            this.each(function (item) {
                result.add(item);
            }, true);

            return result;
        },
        concat: function (source) {
            var results = this.clone();

            push.apply(results.source, new LinqArray(source).source);
            return results;
        },
        clone: function(){
            return new LinqArray(this.source.slice());
        },
        any: function (callback) {
            var result = false;
            this.each(function (item, i) {
                return !(result = callback.call(item, item, i));
            });
            return !!result;
        },
        all: function(callback){
            var result = true;
            this.each(function (item, i) {
                return !!(result = callback.call(item, item, i));
            });
            return result;
        },
        count: function () {
            return this.source.length;
        },
        join: function(s){
            return this.array().join(s);
        },
        array: function () {
            return this.source;
        },
        eq: function(idx){
            return this.source[idx];
        }
    }

    global.linq = LinqArray;
})(window.XT = window.XT || {});

;(function(global){
    var linq = global.linq;
    var tool = global.tool;
    
    var canvas = function(params){
        if(!(this instanceof canvas)){
            return new canvas(params);
        }

        tool.extend(this, {
            dom: null,
            render: null,
            event: null,
            cache: {},
            isRendering: false
        }, params);
        
        this.init();
        //this.draw();
    };

    canvas.prototype = {
        init: function(){
            var _canvas = this;
            var focused, redraw;
            var domX = this.dom.offsetLeft, domY = this.dom.offsetTop;
            var ismobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            var eventType = ismobile ? {
                leave: 'touchleave',
                enter: 'touchenter',
                move: 'touchmove',
                down: 'touchstart',
                up: 'touchend',
                click: 'click'
            }: {
                leave: 'mouseleave',
                enter: 'mouseenter',
                move: 'mousemove',
                down: 'mousedown',
                up: 'mouseup',
                click: 'click'
            };
            var fire = function (type, obj, e, isRedraw) {
                    if(tool.isFunction(_canvas.event)) _canvas.event(type, obj, e); 
                    if(tool.isFunction(obj[type])) obj[type](_canvas, e);
                    redraw = isRedraw !== false;
                };
            var isInRange = function (e) {
                var x, y, focus;
                if(ismobile){
                    var touch = e.touches && e.touches[0] || e.changedTouches && e.changedTouches[0];
                    e.offsetX = x = touch.clientX - domX;
                    e.offsetY = y = touch.clientY - domY;
                }else{
                    x = e.offsetX;
                    y = e.offsetY;
                }

                if(_canvas.items){
                    _canvas.items.each(function () {
                        if(this.inRange && this.inRange(x, y)){
                            focus = this;
                            return false;
                        }
                    }, true)
                }
                
                if(focus) {
                    if(focused){
                        if(focused !== focus){
                            //focused.target.color = focused.color;
                            fire(eventType.leave, focused, e); 
                            focused = focus;
                            fire(eventType.enter, focused, e); 
                        }else{
                            fire(eventType.move, focused, e, tool.isFunction(focused[eventType.move])); 
                        }
                    }else{
                        focused = focus;
                        fire(eventType.enter, focused, e); 
                    }
                }else{
                    if(focused){
                        fire(eventType.leave, focused, e); 
                        focused = focus;
                    }
                }
                if(redraw) {
                    redraw = false;
                    _canvas.draw();
                }
                switch(e.type){
                    case eventType.click:
                    case eventType.down:
                    case eventType.up:
                        if(focused) fire(e.type, focused, e, false);
                        break;
                }
                e.preventDefault();
            }
            this.dom.addEventListener(eventType.click, isInRange);
            this.dom.addEventListener(eventType.down, isInRange);
            this.dom.addEventListener(eventType.up, isInRange);
            this.dom.addEventListener(eventType.move, isInRange);
            this.dom.addEventListener(eventType.leave, function (e) {
                if(focused) fire(eventType.leave, focused);
                focused = false;
                e.preventDefault();
            });
        },
        getTime: function (params) {
            return new Date().getTime();
        },
        getContext: function(callback){
            var cache = this.cache,
                ctx = cache.context;
            if(!ctx) cache.context = ctx = this.dom.getContext("2d");
            if(tool.isFunction(callback)){
                callback.call(this, ctx);
            }
            return ctx;
        },
        draw: (function () {
            var requestFrame = window.requestAnimationFrame       ||
                     window.webkitRequestAnimationFrame ||
                     window.mozRequestAnimationFrame    ||
                     window.oRequestAnimationFrame      ||
                     window.msRequestAnimationFrame     ||
                     function(callback) {
                        window.setTimeout(callback, 1000 / 60);
                     };
            var cancelFrame = window.cancelAnimationFrame       ||
                     window.webkitCancelAnimationFrame	||
                     window.mozCancelAnimationFrame 	||
                     window.oCancelAnimationFrame	    ||
                     window.msCancelAnimationFrame     ||
                     function(id) {
                        clearTimeout(id);
                     };
            
            return function (cleanFrame) {
                if(cleanFrame !== false){
                    cancelFrame(this.rfID);
                }
                if(tool.isFunction(this.render) && this.render.call(this, { time: this.getTime() }) !== false){
                    this.rfID = requestFrame(this.draw.bind(this, false));
                } 
                return this;
            }
        })(),
        clean: function(x, y, w, h){
            this.getContext(function (ctx) {
                ctx.clearRect(w || 0, y || 0, w || this.dom.width, h || this.dom.height);
            })
        },
        center: function (x, y) {
            this.cache.x = x = x - (this.cache.x || 0);
            this.cache.y = y = y - (this.cache.y || 0);
            this.getContext().translate(x, y);
        },
        color: '#CCCCCC',
        lineWidth: 2,
        text: function(x, y, content, styles, callback){
            this.getContext(function (ctx) {
                ctx.font = styles.font || this.font;
                ctx.textBaseline = styles.vertical || 'middle';
                ctx.textAlign = styles.align || "center";
                ctx.fillStyle = styles.color || this.color;
                if(tool.isFunction(callback)) callback(ctx);
                
                ctx.fillText(content, 
                                Math.round(x), 
                                Math.round(y));
            });
        },
        bar: function(x, y, w, h, styles, callback){
            var isStroke = styles.type && styles.type === 'stroke';
            this.getContext(function (ctx) {
                ctx[isStroke ? 'strokeStyle':'fillStyle'] = styles.color || this.color;
                ctx.lineWidth = 1.5;
                if(tool.isFunction(callback)) callback(ctx);
                ctx[isStroke ? 'strokeRect':'fillRect'](x, y, w, h);
            });
        },
        point: function (x, y, r, styles, callback) {
             this.getContext(function (ctx) {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = styles.color || this.color;
                ctx.strokeStyle = this.color;
                ctx.closePath();
                if(tool.isFunction(callback)) callback(ctx);
                ctx.fill();
                ctx.stroke();
            });
        },
        pie: function (x, y, r, starta, enda, styles, callback) {
            this.getContext(function (ctx) {
                ctx.beginPath();
                ctx.arc(x, y, r, starta - Math.PI / 2, enda - Math.PI / 2, false);
                ctx.lineTo(x, y);
                ctx.closePath();
                ctx.lineWidth = styles.lineWidth || this.lineWidth;
                ctx.fillStyle = styles.color || this.color;
                if(tool.isFunction(callback)) callback(ctx);
                ctx.fill();
                ctx.strokeStyle = styles.lineColor || '#FFFFFF';
                ctx.stroke();
            });
        },
        line: function (list, styles, callback) {
            this.getContext(function (ctx) {
                ctx.beginPath();
                tool.each(list, function (i, p) {
                    ctx[i ? 'lineTo' : 'moveTo'](Math.round(p.x), Math.round(p.y));
                })
                ctx.lineWidth = styles.lineWidth || this.lineWidth;
                ctx.strokeStyle = styles.color ||  this.color;
                if(tool.isFunction(callback)) callback(ctx);
                ctx.stroke();
            });
        },
        dashLine: function (list, styles, callback) {
            this.getContext(function (ctx) {
                var dash = styles.dash || 4, len, next, arc, temp;
                tool.each(list, function (i, p) {
                    next = list[i + 1];
                    if(next){
                        len = Math.sqrt(Math.pow(next.x - this.x, 2) + Math.pow(next.y - this.y, 2));
                        arc = Math.atan2(next.y - this.y, next.x - this.x);
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(arc);
                        temp = 0;
                        ctx.beginPath();
                        while(temp < len){
                            ctx.moveTo(temp, 0);
                            temp = Math.min(len, temp + dash);
                            ctx.lineTo(temp, 0);
                            temp = Math.min(len, temp + dash);
                        }
                        ctx.closePath();
                        ctx.restore();
                    }
                })
                ctx.lineWidth = styles.lineWidth || this.lineWidth;
                ctx.strokeStyle = styles.color ||  this.color;
                if(tool.isFunction(callback)) callback(ctx);
                ctx.stroke();
            });
        },
    }
    
    ;(function(){
        var cache = {};
        var _div,
            getDiv = function () {
                if(!_div){
                    _div = document.createElement('div');
                    tool.extend(_div.style, {
                        'position': 'absolute',
                        top: -100,
                        left: -100
                    });
                    document.getElementsByTagName('body')[0].appendChild(_div);
                }
                return _div;
            }
        
        canvas.prototype.getTextHeight = function(font){
            if (!cache[font]) {
                var div = getDiv();
                div.innerHTML = 'abcdefghijklmnopqrstuvwxyz0123456789';
                div.style['display'] = '';
                div.style['font'] = font;
                cache[font] = div.offsetHeight;
                div.style['display'] = 'none';
            }
            return cache[font];
        }
        
        canvas.prototype.getTextWidth = function(font, html){
            var div = getDiv();
            div.innerHTML = html || '';
            div.style['display'] = '';
            div.style['font'] = font;
            var width = div.offsetWidth;
            div.style['display'] = 'none';
            return width;
        }
    })();

    global.canvas = canvas;
})(window.XT = window.XT || {});