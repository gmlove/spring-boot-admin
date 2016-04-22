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

import * as _ from 'lodash';

function normalize(str) {
    return str.replace(/\/\w/, function(s){return s.substr(1).toUpperCase();});
}

function isEndpointPresent(endpoint, configprops) {
    return !!configprops[endpoint];
}

class Application {
    constructor(config, manager, isDefault) {
        this._id = config.id || null;
        this._manager = manager;
        this._isDefault = isDefault;

        this.init(config);
    }

    getCapabilities() {
        if(!this.config.managementUrl) { return null; }

        return this._manager.proxy('GET', this.config.configpropsUrl).then((configprops) => {
            this.capabilities = {
                logfile: isEndpointPresent('logfileMvcEndpoint', configprops),
                activiti: isEndpointPresent('processEngineEndpoint', configprops),
                restart: isEndpointPresent('restartEndpoint', configprops),
                refresh: isEndpointPresent('refreshEndpoint', configprops),
                pause: isEndpointPresent('pauseEndpoint', configprops),
                resume: isEndpointPresent('resumeEndpoint', configprops),
                cache: false
            };
            return this.getMappings();
        }).then((mappings) => {
            this.capabilities.cache = _.keys(mappings).filter((key) => key.indexOf('/admin/cache') !== -1).length > 0;
        });
    }

    get id() {
        return this._id;
    }

    get isDefault() {
        return this._isDefault;
    }

    getHealth() {
        return this._manager.proxy('GET', this.config.healthUrl);
    }

    getInfo() {
        return this._manager.proxy('GET', this.config.infoUrl);
    }

    getMetrics() {
        return this._manager.proxy('GET', this.config.metricsUrl);
    }

    getThreadDump() {
        return this._manager.proxy('GET', this.config.dumpUrl);
    }

    getTraces() {
        return this._manager.proxy('GET', this.config.traceUrl);
    }

    getActiviti() {
        return this._manager.proxy('GET', this.config.activitiUrl);
    }

    getLogging() {
        return this._manager.ApplicationLogging.getLoggingConfigurator(this);
    }

    getEnv(key) {
        return this._manager.proxy('GET', this.config.envUrl + (key ? '/' + key : '' ));
    }

    setEnv(map) {
        return this._manager.proxy('POST', this.config.envUrl, {}, map);
    }

    resetEnv() {
        return this._manager.proxy('POST', this.config.envResetUrl);
    }

    refresh() {
        return this._manager.proxy('POST', this.config.refreshUrl);
    }

    getMappings() {
        return this._manager.proxy('GET', this.config.mappingsUrl);
    }

    evictCache(key) {
        var params = key ? {key: key} : undefined;
        return this._manager.proxy('DELETE', this.config.cacheUrl, params);
    }

    init(config) {
        const endpoints = [
            { name: 'management', key:'managementUrl' },
            { name: 'service', key: 'serviceUrl'},
            ...this._manager.endpoints
        ];

        endpoints.filter(endpoint => !config[endpoint.key])
             .forEach(endpoint => config[endpoint.key] = this._manager.getDefaultUrl(endpoint, config.url));

        this.config = _.pick(config, ['id', 'name', 'url', ...endpoints.map(x => x.key)]);

        this.editableConfig = _.clone(this.config);
    }

    $save(override) {
        if(!this._id) {
            this._id = this.editableConfig.id;
        }

        this.init(this.editableConfig);

        this.statusInfo = {
            status: "IDLE",
            timestamp: Date.now()
        };

        return this._manager.save(this, override);
    }

    $remove() {
        this._manager.remove(this);
    }
}

class ApplicationManager {
    constructor($http, $q, $window, ApplicationLogging, dataStorage) {
        this.$q = $q;
        this.$http = $http;
        this.$window = $window;
        this.dataStorage = dataStorage;
        this.ApplicationLogging = ApplicationLogging;

        this.proxyEndpoint = "/proxy/";

        this.applications = new Map();

        this.endpoints = [
            { name: 'health', key: 'healthUrl' },
            { name: 'configprops', key: 'configpropsUrl'},
            { name: 'info', key: 'infoUrl' },
            { name: 'metrics', key: 'metricsUrl' },
            { name: 'env', key: 'envUrl' },
            { name: 'env/reset', key: 'envResetUrl' },
            { name: 'refresh', key: 'refreshUrl' },
            { name: 'dump', key: 'dumpUrl' },
            { name: 'trace', key: 'traceUrl' },
            { name: 'activiti', key: 'activitiUrl' },
            { name: 'logfile', key: 'logfileUrl'},
            { name: 'mappings', key: 'mappingsUrl'},
            { name: 'admin/cache', key: 'cacheUrl'}
        ];

        this.restore();
    }

    create(appConfig={}, isDefault=false) {
        return new Application(appConfig, this, isDefault);
    }

    get(id) {
        return this.$q.resolve(this.applications.get(id) || null);
    }

    getDefaultUrl(endpoint, url) {
        if(!url) { return ''; }

        switch(endpoint.key) {
            case 'managementUrl':
            case 'serviceUrl':
                return url;
            default:
                return `${url}/${endpoint.name}`;
        }
    }

    query() {
        return this.$q.resolve(Array.from(this.applications.values()));
    }

    remove(app) {
        if(!app.isDefault) {
            this.dataStorage.remove(app.id);
        }

        return this.applications.delete(app.id);
    }

    restore() {
        this.dataStorage.query('application').forEach((config) => {
            this.create(config).$save(true);
        });
    }

    save(app, override=false) {
        if(this.applications.has(app.id) && this.applications.get(app.id) !== app) {
            this.$window.alert('The ID already exist!');
            return false;
        }

        var oldApp = this.applications.get(app.id);
        if(oldApp && oldApp !== app && !override) { return true; }

        this.applications.set(app.id, app);

        if(!app.isDefault) {
            this.dataStorage.remove(app.id);
            this.dataStorage.add(app.config);
        }

        return true;
    }

    proxy(method, url, params, data, headers) {
        headers = headers || {};
        headers['forward-url'] = url;
        return this.$http({url: this.proxyEndpoint, method: method, params: params, data: data, headers: headers}).then(res => res.data);
    }
}

export default function($http, $q, $window, ApplicationLogging, dataStorage) {
    return new ApplicationManager($http, $q, $window, ApplicationLogging, dataStorage);
}
