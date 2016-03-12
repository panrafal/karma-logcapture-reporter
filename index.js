var util = require('util');
var chalk = require('chalk');

var LogCaptureReporter = function (config, baseReporterDecorator, emitter) {

    this.USE_COLORS = !!config.colors;
    var options = config.logCapture || {}
    var showLevel = options.show

    baseReporterDecorator(this);

    this.captured = [];

    var origBrowserLog = this.onBrowserLog;
    this.onBrowserLog = function (browser, log, type) {
        if (typeof log !== 'string') {
            log = util.inspect(log, false, null, this.USE_COLORS);
        }

        log = log.replace(/^'(.*)'$/, '$1');

        if (type === 'dump') {
            origBrowserLog.call(this, browser, log, type);
        }

        var show = false
        if (config.colors) {
            switch (type) {
                case 'error':
                    log = chalk.red.inverse.bold(' ERR ') + ' ' + chalk.reset.dim(log)
                    break;
                case 'warn':
                    show = showLevel === 'warn' || showLevel === 'info' || showLevel === 'log'
                    log = chalk.yellow.inverse.bold(' WRN ') + ' ' + chalk.reset.dim(log)
                    break;
                case 'info':
                    show = showLevel === 'info' || showLevel === 'log'
                    log = chalk.blue.inverse.bold(' INF ') + ' ' + chalk.reset.dim(log)
                    break;
                default:
                    show = showLevel === 'log'
                    log = chalk.grey.inverse.bold(' LOG ') + ' ' + chalk.grey(log)
                    break;
            }
        } else {
            log = type.toUpperCase() + ': ' + log
        }

        switch (type) {
            case 'error':
                show = showLevel === 'error' || showLevel === 'warn' || showLevel === 'info' || showLevel === 'log'
                break;
            case 'warn':
                show = showLevel === 'warn' || showLevel === 'info' || showLevel === 'log'
                break;
            case 'info':
                show = showLevel === 'info' || showLevel === 'log'
                break;
            default:
                show = showLevel === 'log'
                break;
        }

        if (show) {
            console.log('  ' + log)
        }

        this.captured.push(
            log
        );
    };

    this.onSpecComplete = function (browser, result) {
        if (!result.success && !result.skipped && this.captured.length) {
            result.log = [
               result.log.join('\n') +
               '\n\n' +
               (config.colors ? chalk.white('Captured logs:  ') : 'Captured logs:  ') +
               '\n\n  ' +
               this.captured.join('\n  ')
            ]// );
        }

        this.captured = [];
    };

    // HACK: Override log notification for the other reporters
    var self = this;
    var origBind = emitter.bind;
    emitter.bind = function (obj) {
        if (obj !== self) {
            obj.onBrowserLog = util.noop;
        }
        return origBind.call(this, obj);
    };
};

LogCaptureReporter.$inject = ['config', 'baseReporterDecorator', 'emitter'];

module.exports = {
    'reporter:logcapture' : ['type', LogCaptureReporter]
};
