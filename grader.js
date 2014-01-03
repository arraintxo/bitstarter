#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var rest = require('restler');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var wrongRequest = function (request) {
    console.log("%s does not exist. Exiting.", request);
    process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
}

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	wrongRequest(instr);
    }
    return instr;
};

var cheerioHtmlBuffer = function(htmlbuffer) {
    return cheerio.load(htmlbuffer);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlBuffer = function(htmlbuffer, checksfile) {
    $ = cheerioHtmlBuffer(htmlbuffer);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    var main = function(){
	var program = require('commander');
	program
            .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
            .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
            .option('-u, --url <html_url>', 'Url to index.html')
            .parse(process.argv);

	var checkAndOutput = function (htmlBuffer) {
	    var checkJson = checkHtmlBuffer(htmlBuffer, program.checks);
	    var outJson = JSON.stringify(checkJson, null, 4);
	    console.log(outJson);
	}

	if (program.url !== undefined) {
	    var url = program.url.toString();
	    rest.get(url, {decoding: 'utf8'}).on('error', function(data, response) {
		wrongRequest(url);
	    }).on('fail', function(data, response) {
		wrongRequest(url);
	    }).on('success', function(data, response) {
		checkAndOutput(data);
	    });
	} else {
	    var htmlBuffer = fs.readFileSync(program.file.toString());
	    checkAndOutput(htmlBuffer);
	}
    }();

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
