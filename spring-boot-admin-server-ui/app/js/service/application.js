/*
 * Copyright 2014 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var _ = require('lodash');

module.exports = function ($resource, $http, $q, ApplicationLogging, dataStorage) {

    var isEndpointPresent = function(endpoint, configprops) {
        if (configprops[endpoint]) {
           return true;
        } else {
           return false;
        }
    };

    var Application = function (baseUrl, name, id, opts) {
        opts = opts || {};
        baseUrl = baseUrl.charAt(baseUrl.length-1) === '/' ? baseUrl.substring(0, baseUrl.length-1) : baseUrl;
        this.baseUrl = baseUrl;
        this.managementUrl = opts.managementUrl || baseUrl;
        this.healthUrl = opts.healthUrl || baseUrl + '/health';
        this.serviceUrl = opts.serviceUrl || baseUrl;

        var endpoints = ['health', 'configprops', 'info', 'metrics', 'env', 'env/reset', 'refresh', 'dump', 'trace', 'activiti', 'logfile'];
        var self = this;
        _.map(endpoints, function (endpoint) {
            var key = endpoint.replace(/\/\w/, function(s){return s.substr(1).toUpperCase();});
            self[key + 'Url'] = opts[key + 'Url'] || baseUrl + '/' + endpoint;
        });

        this.name = name;
        this.id = id;
        this.statusInfo = {
            status: "UP",
            timestamp: new Date().getTime()
        };
    };

    var _applications = [
        new Application('http://localhost:8080', 'sample-app', 'sample-app')
    ];
    _.each(dataStorage.query(), function(app) {
        if (Application.get(app)) {
            dataStorage.remove(app.id);
        } else {
            Application.add(app);
        }
    });
    var asyncWrap = function (data, cb) {
        if (cb) {
            cb(data);
        }
        return {$promise: $q.when(data)};
    };
    Application.query = function (cb) {
        return asyncWrap(_applications, cb);
    };
    Application.get = function (opts, cb) {
        return asyncWrap(_.filter(_applications, function (app) {
            return app.id === opts.id;
        })[0], cb);
    };
    Application.add = function (app) {
        if (_.filter(_applications, function (_app) {return _app.id === app.id;}).length) {
            throw new Error('App already exists.');
        }
        _applications.push(new Application(app.baseUrl, app.name, app.id, app.opts));
    };
    Application.remove = function (id, cb) {
        return asyncWrap(_.remove(_applications, function (app) {
            return app.id === id;
        }), cb);
    };

    Application.prototype.$remove = function (cb) {
        return Application.remove(this.id, cb);
    };

    var convert = function (request, isArray) {
        isArray = isArray || false;
        var deferred = $q.defer();
        request.success(function(response) {
            var result = response;
            delete result['_links'];
            if (isArray) {
                result = response.content || response;
            }
            deferred.resolve(result);
        }).error(function(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    Application.prototype.getCapabilities = function() {
        var application = this;
        this.capabilities = {};
        if (this.managementUrl) {
            $http.get(this.configpropsUrl).success(function(configprops) {
                application.capabilities.logfile = isEndpointPresent('logfileMvcEndpoint', configprops);
                application.capabilities.activiti = isEndpointPresent('processEngineEndpoint', configprops);
                application.capabilities.restart = isEndpointPresent('restartEndpoint', configprops);
                application.capabilities.refresh = isEndpointPresent('refreshEndpoint', configprops);
                application.capabilities.pause = isEndpointPresent('pauseEndpoint', configprops);
                application.capabilities.resume = isEndpointPresent('resumeEndpoint', configprops);
            });
        }
    };

    Application.prototype.getHealth = function () {
        return convert($http.get(this.healthUrl));
    };

    Application.prototype.getInfo = function () {
        return convert($http.get(this.infoUrl));
    };

    Application.prototype.getMetrics = function () {
        return convert($http.get(this.metricsUrl));
    };

    Application.prototype.getEnv = function (key) {
        return convert($http.get(this.envUrl + (key ? '/' + key : '' )));
    };

    Application.prototype.setEnv = function (map) {
        return convert($http.post(this.envUrl, '', {params: map}));
    };

    Application.prototype.resetEnv = function () {
        return convert($http.post(this.envResetUrl));
    };

    Application.prototype.refresh = function () {
        return convert($http.post(this.refreshUrl));
    };

    Application.prototype.getThreadDump = function () {
        return convert($http.get(this.dumpUrl), true);
    };

    Application.prototype.getTraces = function () {
        return convert($http.get(this.traceUrl), true);
    };

    Application.prototype.getActiviti = function () {
        return convert($http.get(this.activitiUrl));
    };

    Application.prototype.getLogging = function() {
        return ApplicationLogging.getLoggingConfigurator(this);
    };

    return Application;
};
