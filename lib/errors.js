const ce = require('c-e');

module.exports = {
    URIError: ce('URIError', Error, function(url){
        if(url === undefined){
            this.message = 'URL not specified';
        } else {
            this.message = 'Invalid URL';
            this.url = url;
        }
    }),
    TimeoutError: ce('TimeoutError', Error, function(url, timeout, timings){
        this.message = 'Request aborted by timeout';
        this.url = url;
        this.timeout = timeout;
        this.timings = timings;
        this.errorTime = Date.now();
    }),
    NetworkError: ce('NetworkError', Error, function(url, cause, timings){
        this.message = 'Unable to connect the server';
        this.url = url;
        this.cause = cause;
        this.timings = timings;
        this.errorTime = Date.now();
    }),
};
