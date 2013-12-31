'use strict'

var request = require("request"),
	cheerio = require("cheerio"),
	fs = require("fs"),
	Q = require("q"),
	extend = require('extend');

// base options
var BASE_OPTIONS = {
	headers: {
		"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36",
		"Cache-Control": "no-cache",
		"Pragma": "no-cache"
	}
};

// define some API
var unsupported = function(fnName) {
	return function() {
		throw new Error(fnName+"() has not been implemented yet.");
	};
}

var api = {
	get: unsupported('get'),
	post: unsupported('post'),
	"get$": unsupported('get$'),
	"post$": unsupported('post$'),
	getJson: unsupported('getJson'),
	postJson: unsupported('postJson'),
	clearCookies: unsupported('clearCookies'),
	download: unsupported('download'),
	debug: unsupported('debug')
};

// session factory
var SessionFactory = function() {

	return {
		session: function(customOptions) {
			return Scrape(customOptions);
		},
		cookieSession: function(customOptions) {
			var cookieJar = request.jar();
			return Scrape(customOptions, cookieJar);
		}
	}
}();

// the module itself, must be created via SessionFactory
var Scrape = function(customOptions, jar) {

	var impl = extend({}, api);
	customOptions = (customOptions || {});
	jar && (customOptions.jar = jar);

	var get = function(uri, params) {

		var deferred = Q.defer();

		var options = extend({}, BASE_OPTIONS, customOptions);
		options.uri = uri;
		params && (options.form = params);

		console.log('GET ', uri);		

		request(options, function(err, resp, body) {
			if (err) {
				deferred.reject(err);
			} else if (resp.statusCode !== 200) {
				deferred.reject(new Error('GET ERROR HTTP '+resp.statusCode));
			} else {
				deferred.resolve(body);
			}
		});

		return deferred.promise;
	};

	// any way to avoid repeating myself?
	var post = function(uri, params) {

		var deferred = Q.defer();

		var options = extend({}, BASE_OPTIONS, customOptions);
		options.uri = uri;
		options.method = 'POST';
		params && (options.form = params);

		console.log('POST ', uri);

		request(options, function(err, resp, body) {
			if (err) {
				deferred.reject(err);
			} else if (resp.statusCode !== 200) {
				deferred.reject(new Error('GET ERROR HTTP '+resp.statusCode));
			} else {
				deferred.resolve(body);
			}
		});

		return deferred.promise;
	};

	var get$ = function(uri, params) {
		return get(uri, params)
			.then(function(body) {
				return cheerio.load(body, { lowerCaseTags: true});
			});
	};

	var post$ = function(uri, params) {
		return post(uri, params)
			.then(function(body) {
				return cheerio.load(body, { lowerCaseTags: true});
			});	
	};

	var getJson = function(uri, params) {
		return get(uri, params)
			.then(function(body) {
				// fix unicode in JSON response
				var re = /\\x([0-9a-fA-F]{2})/g;
				return JSON.parse(body.replace(re, function(m, n){return String.fromCharCode(parseInt(n,16))}));
			});
	};

	var postJson = function(uri, params) {
		return post(uri, params)
			.then(function(body) {
				// fix unicode in JSON response
				var re = /\\x([0-9a-fA-F]{2})/g;
				return JSON.parse(body.replace(re, function(m, n){return String.fromCharCode(parseInt(n,16))}));
			});	
	};

	var download = function(uri, filename) {
		console.log('DOWNLOAD ',uri);
		var deferred = Q.defer();

		var writeStream = fs.createWriteStream(filename);

		request(uri).pipe(writeStream);
		writeStream.on('error', function(err) {
			deferred.reject(err);
		}).on('finish', function() {
			writeStream.close();
			deferred.resolve(filename);
		});

		return deferred.promise;
	}

	impl.get = get;
	impl.post = post;
	impl.get$ = get$;
	impl.post$ = post$;
	impl.getJson = getJson;
	impl.postJson = postJson;
	impl.download = download;

	return impl;

};

module.exports = SessionFactory;