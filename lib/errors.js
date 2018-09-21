/* eslint no-invalid-this: "off" */
const ce = require('c-e');

const RequestError = ce('RequestError', Error);

module.exports = {
    TimeoutError: ce('TimeoutError', RequestError, function(url, timeout, timings, timingPhases){
        this.message = 'Request aborted by timeout';
        this.url = url;
        this.timeout = timeout;
        this.timings = timings;
        this.timingPhases = timingPhases;
        this.errorTime = Date.now();
    }),
    NetworkError: ce('NetworkError', RequestError, function(url, cause, timings, timingPhases){
        this.message = 'Unable to connect the server';
        this.url = url;
        this.cause = cause;
        this.timings = timings;
        this.timingPhases = timingPhases;
        this.errorTime = Date.now();
    }),
    ZlibError: ce('ZlibError', Error, function(url, encoding){
        this.message = 'Zlib error';
        this.url = url;
        this.encoding = encoding;
        this.errorTime = Date.now();
    }),
};
