# qScraper - Promises-based Web scraping library

Simple, basic web scraping with support for cookies, jQuery functionality. Uses [Promises/A+][refp] specification in place of callbacks.

## Usage

qScraper works along the lines of "sessions".

	var scraper = require('qscraper');
	var session = scraper.session(); // creates new "session" (stateless, no cookies)
	var cookieSession = scrape.cookieSession(); // creates a session with it's own cookiejar.

## API

`params` refers to a JSON key-value map, e.g. `{ "name": "myname", "password": "secret"}`

Returns raw body:

`session.get(uri, params)`  
`session.post(uri, params)`

e.g.

    session.get('http://google.com')
           .then(function(body) {
           	    console.log(body); // prints out raw HTML
           	});

Returns jQuery $:

`session.get$(uri, params)`  
`session.post$(uri, params)`

e.g.

    session.get$('http://google.com')
           .then(function($) {
           	    console.log($('title').text()); // prints out "Google"
           	});


Returns parsed JSON response:

`session.getJson(uri, params)`  
`session.postJson(uri, params)`

e.g.

    var params = {
        'address': '1600 Amphitheatre Parkway, Mountain View, CA',
        'sensor': 'false'
    };

    session.getJson('http://maps.googleapis.com/maps/api/geocode/json', params)
           .then(function(json) {
           	    console.log(json); // prints out JSON response
           	});

Download a file to a filename - currently no custom options.

* If the filename is not specified, qscraper attempts to derive the filename from the uri.
* If the filename is a directory that exists, qscraper will derive the filename from the uri and download to that folder.

`session.download(uri, filename)`

e.g.

    session.download('https://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js')
           .then(function(filename) {
           	    console.log(filename); // prints out 'swfobject.js', which is downloaded.
           	});

Scraping sometimes requires custom headers, e.g. setting the Referrer. 

`session.addHeader(key, value)`

e.g.

  session.addHeader('Referer', 'http://www.google.com')
      .then(function() {
          return session.get('http://myhttp.info');
      });

## Credits

* kriskowal's [Q][ref1]
* MatthewMueller's [cheerio][ref2]
* mikeal's [request][ref3]

[ref1]: https://github.com/kriskowal/q
[ref2]: https://github.com/MatthewMueller/cheerio
[ref3]: https://github.com/mikeal/request
[refp]: http://promises-aplus.github.io/promises-spec/
