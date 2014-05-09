'use strict'

var request = require("request"),
	cheerio = require("cheerio"),
	fs = require("fs"),
	url = require("url"),
	Q = require("q"),
	extend = require('extend'),
	zlib = require('zlib');

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

var betterRequest = function(options, callback) {

	// my god why doesn't mikeal just bake this shit into request
	var req = request(options);

	// adapted from http://nickfishman.com/post/49533681471/nodejs-http-requests-with-gzip-deflate-compression
	// TODO: Consider a streamed approach next time
	req.on('response', function(res) {
		var chunks = [];

		res.on('data', function(chunk) {
			chunks.push(chunk);
		});

		res.on('end', function() {
			var buffer = Buffer.concat(chunks),
				encoding = res.headers['content-encoding'];

			try {
				if (encoding === 'gzip') {
					console.log('Content is gzipped');
					zlib.gunzip(buffer, function(err, decoded) {
						callback(err, res, decoded && decoded.toString());
					});
				} else if (encoding === 'deflate') {
					console.log('Content is deflated');
					zlib.inflate(buffer, function(err, decoded) {
						callback(err, res, decoded && decoded.toString());
					});
				} else {
					return callback(null, res, buffer && buffer.toString());
				}
			} catch (e) {
				callback(e);
			}

		});

	});

	req.on('error', callback);
};

// the module itself, must be created via SessionFactory
var Scrape = function(customOptions, jar) {

	var impl = extend({}, api);
	customOptions = (customOptions || {});
	jar && (customOptions.jar = jar);

	var get = function(uri, params) {

		var deferred = Q.defer();

		var options = extend({}, BASE_OPTIONS, customOptions);
		options.uri = uri;
		params && (options.qs = params);

		console.log('GET ', uri);

		betterRequest(options, function(err, resp, body) {
			if (err) {
				deferred.reject(err);
			} else if (resp.statusCode !== 200) {
				console.error(options);
				deferred.reject(new Error('GET ERROR HTTP '+resp.statusCode+':'+body));
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

		betterRequest(options, function(err, resp, body) {
			if (err) {
				deferred.reject(err);
			} else if (resp.statusCode !== 200) {
				deferred.reject(new Error('GET ERROR HTTP '+resp.statusCode+':'+body));
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

		if (!filename) {
			// just try to extract the last name in the path
			try {
				filename = /[^\/]+$/.exec(url.parse(uri,true).pathname)[0];
			} catch (e) {
				deferred.reject(new Error('Could not determine filename from ' + uri));
				return deferred.promise;
			}
		}

		var writeStream = fs.createWriteStream(filename),
			req = request(uri);

		// again, adapted from http://nickfishman.com/post/49533681471/nodejs-http-requests-with-gzip-deflate-compression,
		// but this time this is clearly a use case for streams
		req.on('response', function(res) {
			var encoding = res.headers['content-encoding'];

			if (res.statusCode !== 200) {
				deferred.reject(new Error('GET ERROR HTTP '+resp.statusCode))
			} else {
				if (encoding === 'gzip') {
					res.pipe(zlib.createGunzip()).pipe(writeStream);
				} else if (encoding === 'deflate') {
					res.pipe(zlib.createInflate()).pipe(writeStream);
				} else {
					res.pipe(writeStream);
				}
			}
		});

		req.on('error', function(err) {
			deferred.reject(err);
		});

		writeStream.on('error', function(err) {
			deferred.reject(err);
		}).on('finish', function() {
			writeStream.close();
			deferred.resolve(filename);
		});

		return deferred.promise;
	};

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