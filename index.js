var PageRank = require('pagerank'),
    async = require('async'),
    request = require('request');

var google = {

    pagerank: function(p, cb) {
        new PageRank(p.url, cb);
    },

    search: require('./lib/google-search.js').search,

    suggest: require('./lib/google-suggest.js').suggest,

    deep_suggest: function(q, cb) {
        var i = 0;
        var next = function(items, cb) {
            if(i == 26) cb(null, items);
            else suggest({q: q.q+"+"+String.fromCharCode(97+(i++)) }, function(err, r) {
                next(items.concat(r), cb);
            });
        };
        next([], cb);
    },


    pagerankAvg: function(p, cb) {
        google.search(p, function(err, results) {
            if(err) { return cb(err, null); }

            async.mapSeries(results.results, function(r, cb) {
                google.pagerank({
                    url: r.link
                }, cb);
            }, function(err, results) {
                if(err) { return cb(err, null); }

                var sum = results.reduce(function(a,b){return a+b;})
                cb(null, Math.floor(100*sum/results.length)/100);
            });

        });
    },

    position: function(p, cb) {
        google.search(p, function(err, results) {
            if(err) { return cb(err, null); }

            for(var i = 0 ; i < results.results.length; i++) {

                if(!results.results[i].link) { continue; };

                if(results.results[i].link.substr(0, p.url.length) === p.url) {
                    cb(null, i+1);
                    return;
                }
            }

            cb(null, -1);
        });
    },

    accesstime: function(p, cb) {
      request('http://webcache.googleusercontent.com/search?q=cache:'
          + p.url.replace(/(https?:\/\/)?(www\.)?([^\/]*).*/, '$3')
          + '&cd=1&hl=en&ct=clnk&gl=us', function(err, res, body) {
        if(err) { 
          return cb(err, null);
        } else if (res.statusCode != 200) {
            return callback('Error: code '+res.statusCode, null);
        }

        var dateString = body.match(/snapshot of the page as it appeared on ([^\.]*)\./)[0].replace(/.*on ([^\.]*)\./, '$1');

        cb(null, new Date(dateString).getTime());
      });
    }

};

module.exports = google;
