# qScraper - Promises-based Web scraping library

Simple, basic web scraping with support for cookies, jQuery functionality. Uses [Promises/A+][refp] specification in place of callbacks.

## Usage

qScraper works along the lines of "sessions".

	var scraper = require('qscraper');
	var session = scrape.session(); // creates new "session" (stateless, no cookies)
	var cookieSession = scrape.cookieSession(); // creates a session with it's own cookiejar.

## API

`params` refers to a JSON key-value map, e.g. `{ "name": "myname", "password": "secret"}`

Returns raw body:

* `session.get(uri, params)`
* `session.post(uri, params)`

Returns jQuery $:

* `session.get$(uri, params)`
* `session.post$(uri, params)`

Returns parsed JSON response:

* `session.getJson(uri, params)`
* `session.postJson(uri, params)`

Download a file to a filename - currently no custom options:

* `session.download(uri, filename)`

## Credits

* kriskowal's [Q][ref1]
* MatthewMueller's [cheerio][ref2]
* mikeal's [request][ref3]

[ref1]: https://github.com/kriskowal/q
[ref2]: https://github.com/MatthewMueller/cheerio
[ref3]: https://github.com/mikeal/request
[refp]: http://promises-aplus.github.io/promises-spec/
