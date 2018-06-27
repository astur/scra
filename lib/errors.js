const ce = require('c-e');

const RequestError = ce('RequestError', Error);

module.exports = {
    TimeoutError: ce('TimeoutError', RequestError, function(url, timeout, timings){
        this.message = 'Request aborted by timeout';
        this.url = url;
        this.timeout = timeout;
        this.timings = timings;
        this.errorTime = Date.now();
    }),
    NetworkError: ce('NetworkError', RequestError, function(url, cause, timings){
        this.message = 'Unable to connect the server';
        this.url = url;
        this.cause = cause;
        this.timings = timings;
        this.errorTime = Date.now();
    }),
};
