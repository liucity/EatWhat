(function ($) {
    $.extend({
        FormatHelper: {
            format: function (value, fmt, ext) {
                var rst;
                if ($.isFunction(fmt)) {
                    rst = fmt(value, ext);
                } else if (this.NumberFormatter[fmt] && $.isFunction(this.NumberFormatter[fmt])) {
                    rst = this.NumberFormatter[fmt].call(this.NumberFormatter, value, ext);
                } else if (this.NumberFormatter._mapping(fmt)) {
                    rst = this.NumberFormatter._mapping(fmt).call(this.NumberFormatter, value, ext);
                } else if (this.DateFormatter[fmt] && $.isFunction(this.DateFormatter[fmt])) {
                    rst = this.DateFormatter[fmt].call(this.DateFormatter, value, ext);
                } else if (window[fmt] && $.isFunction(window[fmt])) {
                    rst = window[fmt](value, ext);
                }
                return rst || value;
            },
            NumberFormatter: {
                number: function (value) {
                    return this.numberFormat(value, "###,###,##0");
                },
                numberWithOneDecimal: function (value) {
                    return this.numberFormat(value, "###,###,##0.0");
                },
                numberWithTwoOneDecimal: function (value) {
                    return this.numberFormat(value, "###,###,##0.00");
                },
                percentage: function (value) {
                    return this.numberFormat(value, "###,###,##0.0%");
                },
                percentageWithTwoDecimal: function (value) {
                    return this.numberFormat(value, "###,###,##0.00%");
                },
                percentageWithoutDecimal: function (value) {
                    return this.numberFormat(value, "###,###,##0%");
                },
                currency: function (value) {
                    return this.numberFormat(value, "-$###,###,##0.00");
                },
                currencyWithOneDecimal: function (value) {
                    return this.numberFormat(value, "-$###,###,##0.0");
                },
                currencyWithoutDecimal: function (value) {
                    return this.numberFormat(value, "-$###,###,##0");
                },
                numberFormat: function (value, format) {
                    return $.formatNumber(value, { format: format });
                },
                _mapping: function (name) {
                    switch (name) {
                        case "C0":
                            return this.currencyWithoutDecimal;
                        case "C1":
                            return this.currencyWithOneDecimal;
                        case "C2":
                            return this.currency;
                        case "N0":
                            return this.number;
                        case "N1":
                            return this.numberWithOneDecimal;
                        case "N2":
                            return this.numberWithTwoOneDecimal;
                        case "P0":
                            return this.percentageWithoutDecimal;
                        case "P1":
                            return this.percentage;
                        case "P2":
                            return this.percentageWithTwoDecimal;
                    }
                    return null;
                }
            },
            DateFormatter: {
                date: function (value) {
                    return this.dateFormat(value, "YYYY-MM-DD")
                },
                dateTime: function (value) {
                    return this.dateFormat(value, "YYYY-MM-DD HH:mm:ss")
                },
                dateFormat: function (value, format) {
                    return new moment(value).format(format);
                }
            },
            StringFormatter: {
                stringFormat: function (value, format) {
                    var replacer_reg = /<%\s*([^%][^>]*)\s*%>/g;
                    var str = [];
                    if (!value) return format;
                    if (!$.isArray(value)) value = [value];
                    $.each(value, function (i, v) {
                        str.push(format.replace(replacer_reg, function (idx, m) {
                            return v[m] === undefined ?
                                typeof v === 'string' || typeof v === 'number' ? v : ''
                                :
                                v[m];
                        }));
                    })
                    return str.join('');
                }
            },
            ColorFormatter: {
                rgb2hex: function (r, g, b) {
                    return $c.rgb2hex(r, g, b)
                },
                hex2rgb: function (hex) {
                    return $c.hex2rgb(hex).a
                },
                name2hex: function (name) {
                    return $c.hex2rgb(hex)
                },
                name2rgb: function (name) {
                    return $c.hex2rgb(hex).a
                },
                hexGradient: function (hex1, hex2, p) {
                    var rgb1 = $c.hex2rgb(hex1);
                    var rgb2 = $c.hex2rgb(hex2);
                    var r = rgb1.R + parseInt((rgb2.R - rgb1.R) * p);
                    var g = rgb1.G + parseInt((rgb2.G - rgb1.G) * p);
                    var b = rgb1.B + parseInt((rgb2.B - rgb1.B) * p);
                    return $c.rgb2hex(r, g, b);
                }
            }
        },
        Template: function (template, data) {
            return $.FormatHelper.StringFormatter.stringFormat(data, template);
        }
    });

    var CL = {
        addProperty: function (key, value) {
            Object.defineProperty(this, key, { get: value });
            return this;
        },
        addDateProperty: function (key, date, format) {
            this.addProperty(key, function () {
                return new moment(date, format);
            });
            return this;
        },
        browser: {
            isTouch: (function () {
                var touchEvent = 'ontouchstart' in document.documentElement;
                return touchEvent;
            })(),
            isChrome: !!window.chrome,
            IEVersion: (function () {//win7,win8.1,win8.1 dektop
                var rv = -1;
                if (navigator.appName == 'Microsoft Internet Explorer') {
                    var ua = navigator.userAgent;
                    var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
                    if (re.exec(ua) != null)
                        rv = Number(RegExp.$1);
                } else if (navigator.appName == 'Netscape') {
                    var ua = navigator.userAgent;
                    var re = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
                    if (re.exec(ua) != null)
                        rv = Number(RegExp.$1);
                }
                return rv;
            })()
        },
        error: function () {
            console.error.apply(console, arguments);
            if (false && this.IsDebug) {
                $('body').quickNote({
                    panelClass: 'panel-danger',
                    title: 'Error',
                    showTime: false,
                    timeout: -1,
                    message: (new CL.linq([].slice.call(arguments, 0)).where(function (i, item) { return typeof item !== 'object'; })).array().join(', ')
                })
            }
        },
        info: function () {
            console.info.apply(console, arguments);
        },
        log: function () {
            console.log.apply(console, arguments);
            if (this.IsDebug) {
                return;
                $('body').quickNote({
                    title: 'Log',
                    showTime: false,
                    message: (new CL.linq([].slice.call(arguments, 0)).where(function (i, item) { return typeof item !== 'object'; })).array().join(', ')
                })
            }
        },
        HandleAjaxResult: function (ajaxResult) {
            if (ajaxResult.flag != true) {
                if (ajaxResult.msg) {
                    alert(ajaxResult.msg);
                }
                if (ajaxResult.error) {
                    CL.error(ajaxResult.error)
                }
                if (ajaxResult.redirect) {
                    window.location.href = ajaxResult.redirect;
                }
                return false;
            }
            return ajaxResult.data || null;
        },
        url: function (base, params, traditional) {
            var urlParam = $.extend({}, params);
            var urlBase = base || "";
            var urlParamSeries = $.param(urlParam, traditional);
            var paramSP = urlParamSeries.length > 0 ? "?" : "";
            return urlBase + paramSP + urlParamSeries;
        },
        /*---------------------------------event fired when transition end *CSS3*--------------------------*/
        eventName: (function () {
            var detectName = function (mapping) {
                var i,
                    el = document.createElement('div');

                for (i in mapping) {
                    if (el.style[i] !== undefined) {
                        return mapping[i];
                    }
                }
            }
            return {
                detectName: detectName,
                transitionEnd: detectName({
                    'transition': 'transitionend',
                    'OTransition': 'oTransitionEnd',
                    'MozTransition': 'transitionend',
                    'WebkitTransition': 'webkitTransitionEnd'
                }),
                animationEnd: detectName({
                    'animation': 'animationend',
                    'OAnimation': 'oanimationend',  // oAnimationEnd in very old Opera
                    'MozAnimation': 'animationend',
                    'WebkitAnimation': 'webkitAnimationEnd'
                })
            };
        })(),
        stringify: function (obj) {
            var result;
            if ($.isArray(obj)) {
                result = [];
                $.each(obj, function (i, item) {
                    result.push(JSON.stringify(item));
                })
            } else {
                result = JSON.stringify(obj);
            }
            return result;
        },
        post: function (params) {//params: {   url: '', data: {}, done: function    }
            return $.post(params.url, params.data)
            .done(function (rst) {
                var data = CL.HandleAjaxResult(rst);
                if ($.isFunction(params.done)) {
                    params.done(data);
                }
            })
            .error(function () {
                if ($.isFunction(params.error)) {
                    params.error();
                }
            })
            .always(function () {
                if ($.isFunction(params.always)) {
                    params.always();
                }
            })
        },
        loadPage: function (param) {
            if (typeof param === 'string') {
                param = { url: param };
            } else if (param && param.data) {
                var data = {};
                $.each(param.data, function (k, v) {
                    var noValue = (v === undefined || v === null);
                    if (!noValue) {
                        data[k] = v;
                    }
                })
                param.data = data;
            }
            $.pjax($.extend({
                url: window.location.href,
                container: "#main-container"
            }, param));
        },
        download: function (key) {
            window.location.href = CL.urls.DownloadFile + '?key=' + key;
        },
        trackLog: function (action, information) {
            this.post({
                url: this.urls.TrackLog,
                data: {
                    action: action,
                    information: information
                }
            });
        },
        trackChartLog: function (action, charts) {
            $(charts).each(function (idx, chart) {
                var xtChart = $(chart).data("report");
                if (xtChart) {
                    CL.trackLog(
                        action,
                        'id:' + xtChart.key + '|title:' + (xtChart.title || xtChart.element.find('.table-title b').text()) + '|filters:' + JSON.stringify(xtChart.getFilters())
                    );
                }
            })
        },
        math: {
            random: function (max) {
                return Math.round((max || 1) * Math.random());
            },
            inRange: function (x, min, max) {
                return Math.min(max, Math.max(min, x));
            }
        },
        color: {
            random: function () {
                var color = CL.math.random(16777215).toString(16);
                var l = 6 - color.length;
                while (l--) {
                    color = '0' + color;
                }
                return '#' + color;
            }
        },
        urls: {
            getParam: function (key) {
                var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
                var r = window.location.search.substr(1).match(reg);
                if (r != null) return unescape(r[2]);
                return null;
            },
            getParams: (function () {
                var reg = /\+/g;
                return function () {
                    var params = {};
                    $.each(window.location.search.substr(1).split('&'), function (i, item) {
                        item = item.split('=');
                        params[item[0]] = (item[1] || '').replace(reg, ' ');
                    });
                    return params;
                }
            })(),
            getPaths: function () {
                return window.location.pathname.split('/').slice(1);
            },
            getLastPath: function () {
                var paths = this.getPaths();
                return paths[paths.length - 1];
            }
        },
        delay: (function () {
            var cache = {};
            return function (key, callback, timeout) {
                if (cache[key]) {
                    clearTimeout(cache[key]);
                    cache[key] = undefined;
                }
                cache[key] = setTimeout(function () {
                    cache[key] = undefined;
                    callback();
                }, timeout);
            }
        })(),
        controller: function(data, onChange){
            var model = {};
            var equal = function(source, target){
                var isEqual = source === target;
                if(!isEqual && typeof source === typeof target && typeof source === 'object'){
                    isEqual = source.length === target.length;
                    if(isEqual){
                        $.each(source, function(k, v){
                            if(target[k] !== v){
                                return isEqual = false;
                            }
                        })
                    }
                }
                return isEqual;
            }
            
            $.each(data, function(_key, _value){
                Object.defineProperty(model, _key, { 
                    set: function(value){
                        if(!equal(value, _value)){
                            onChange(_key, _value, value);
                            _value = value;
                        }
                    },
                    get: function(){
                        return _value;
                    },
                    enumerable: true
                });
            })

            return model;
        }
    };

    CL.addProperty('pageHeight', function () {
        return $(window).height() - $('.navbar').height() - $('.page-header').height() - 24 - 20
    })

    if (window.CL) {
        $.extend(window.CL, CL);
    } else {
        window.CL = CL;
    }
})(jQuery);
