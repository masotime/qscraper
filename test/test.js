var assert = require('assert'),
	chai = require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	Q = require('q'),
	fs = require('fs'),
	path = require('path'),
	mkdirp = require('mkdirp'),
	qscraper = require('../lib/scrape');

chai.use(chaiAsPromised);
var should = chai.should();

beforeEach(function() {
});

describe('QScraper', function() {

	var scrapeApi = ['get', 'post', 'get$', 'post$', 'getJson', 'postJson', 'clearCookies', 'download', 'debug'];

	describe('#session()', function() {
		it('should return a scrape object', function() {
			var session = qscraper.session();
			session.should.be.an('object');
			scrapeApi.forEach(function(apiName) {
				session.should.have.property(apiName);
				session[apiName].should.be.a('function');
			});
		});

		describe('#get()', function() {
			it('should be able to fetch Google\'s home page', function() {
				return qscraper.session().get('https://www.google.com').should.eventually.contain('<title>Google</title>');
			});
		});

		describe('#get$()', function() {
			it('should get a $ representation of Google\'s home page', function() {
				return qscraper.session().get$('https://www.google.com').then(function($) {
					return $('title').text();
				}).should.eventually.equal('Google');
			});
		});

		describe('#getJson()', function() {
			it('should be able to fetch a JSON response from Google\'s GEOCoding API', function() {
				var params = {
					'address': '1600 Amphitheatre Parkway, Mountain View, CA',
					'sensor': 'false'
				};

				var jsonPromise = qscraper.session().getJson('http://maps.googleapis.com/maps/api/geocode/json', params);

				return Q.all([
					jsonPromise.should.eventually.have.property('results'),
					jsonPromise.get('status').should.eventually.equal('OK')
				]);
			});
		});

		describe('download', function() {
			var url = 'https://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js',
				innerpath = 'tempinnerfolder',
				baseName = 'swfobject.js',
				newName = 'differentswfobject.js';

			it('should be able to download the SWF object javascript library from Google\'s CDN', function() {
				var downloadPromise = qscraper.session().download(url),
					expectedFilename = baseName;

				return downloadPromise.then(function(filename) {
					var contents = Q.ninvoke(fs, 'readFile', filename, {encoding: 'utf8'});

					return Q.all([
						filename.should.equal(expectedFilename),
						contents.should.eventually.contain('SWFObject')
					]);
				});
			});

			it('should be able to download to the "inner" folder when that is used as the "target filename"', function() {
				mkdirp(innerpath, function(err) {
					var downloadPromise = qscraper.session().download(url, innerpath),
						expectedFilename = path.join(innerpath, baseName);

					return downloadPromise.then(function(filename) {
						var contents = Q.ninvoke(fs, 'readFile', filename, {encoding: 'utf8'});

						return Q.all([
							filename.should.equal(expectedFilename),
							contents.should.eventually.contain('SWFObject')
						]);
					});
				});
			});

			it('should be able to download the SWF object java library under a different name', function() {
				var downloadPromise = qscraper.session().download(url, newName),
					expectedFilename = newName;

				return downloadPromise.then(function(filename) {
					var contents = Q.ninvoke(fs, 'readFile', filename, {encoding: 'utf8'});

					return Q.all([
						filename.should.equal(expectedFilename),
						contents.should.eventually.contain('SWFObject')
					]);
				});				
			});

			afterEach(function() {
				fs.existsSync(baseName) && fs.unlinkSync(baseName);
				fs.existsSync(newName) && fs.unlinkSync(newName);
				fs.existsSync(path.join(innerpath, baseName)) && fs.unlinkSync(path.join(innerpath, baseName));
				fs.existsSync(innerpath) && fs.rmdirSync(innerpath);
			});
		});

		describe('addHeader', function() {
			it('should be able to add a header that is sent in the HTTP request', function() {
				var session = qscraper.session();
				return session.addHeader('Referer', 'nonsense')
					.then(function() {
						return session.get$('http://myhttp.info/');
					}).then(function($) {
						return $('td:contains("Referer")').next().text();
					}).should.eventually.contain('nonsense');
			})
		})

	});

})