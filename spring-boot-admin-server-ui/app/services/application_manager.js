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
    constructor(config, manager) {
        this._id = config.id || null;
        this._manager = manager;

        this.init(config);
    }

    getCapabilities() {
        if(!this.managementUrl) { return null; }

        this._manager.$http.get(this.configpropsUrl).then((configprops) => {
            this.capabilities = {
                logfile: isEndpointPresent('logfileMvcEndpoint', configprops),
                activiti: isEndpointPresent('processEngineEndpoint', configprops),
                restart: isEndpointPresent('restartEndpoint', configprops),
                refresh: isEndpointPresent('refreshEndpoint', configprops),
                pause: isEndpointPresent('pauseEndpoint', configprops),
                resume: isEndpointPresent('resumeEndpoint', configprops)
            };
        });
    }
    
    get id() {
        return this._id;
    }

    get health() {
        return this._manager.$http.get(this.config.healthUrl).then(res => res.data);
    }


    get info() {
        return this._manager.$http.get(this.config.infoUrl).then(res => res.data);
    }

    get metrics() {
        return this._manager.$http.get(this.config.metricsUrl).then(res => res.data);
    }

    get threadDump() {
        return this._manager.$http.get(this.config.dumpUrl).then(res => res.data.content);
    }

    get traces() {
        return this._manager.$http.get(this.config.traceUrl).then(res => res.data.content);
    }

    get activiti() {
        return this._manager.$http.get(this.config.activitiUrl.then(res => res.data));
    }

    get logging() {
        return this._manager.ApplicationLogging.getLoggingConfigurator(this);
    }

    getEnv(key) {
        return this._manager.$http.get(this.config.envUrl + (key ? '/' + key : '' )).then(res => res.data);
    }

    setEnv(map) {
        return this._manager.$http.post(this.config.envUrl, '', {params: map}).then(res => res.data);
    }

    resetEnv() {
        return this._manager.$http.post(this.config.envResetUrl).then(res => res.data);
    }

    refresh() {
        return this._manager.$http.post(this.config.refreshUrl).then(res => res.data);
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

        this._manager.save(this, override);
    }

    $remove() {
        this._manager.remove(this.id);
    }
}

class ApplicationManager {
    constructor($http, $q, ApplicationLogging, dataStorage) {
        this.$q = $q;
        this.$http = $http;
        this.dataStorage = dataStorage;
        this.ApplicationLogging = ApplicationLogging;
        
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
            { name: 'logfile', key: 'logfileUrl'}
        ];
    }

    create(appConfig={}) {
        return new Application(appConfig, this);
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

    remove(id) {
        return this.applications.delete(id);
    }

    restore() {
        this.dataStorage.query('application').forEach((appConfig) => {
            this.create(appConfig).$save(true);
        });
    }

    save(app, override=false) {
        var oldApp = this.applications.get(app.id);
        if(oldApp && oldApp !== app && !override) { return; }

        this.applications.set(app.id, app);
    }
}

export default function($http, $q, ApplicationLogging, dataStorage) {
    return new ApplicationManager($http, $q, ApplicationLogging, dataStorage);
}
