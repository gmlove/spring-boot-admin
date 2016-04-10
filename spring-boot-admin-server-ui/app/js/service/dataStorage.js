'use strict';

var _ = require('lodash');

module.exports = function ($q, localStorageService, ApplicationLogging) {
    console.log('use storage type: ' + localStorageService.getStorageType());

    var appsKey = 'apps';
    var version = 1;

    this.query = function () {
        var apps = localStorageService.get(appsKey);
        if (apps && apps.version === version) {
            return apps.apps;
        }
        return [];
    };

    this._save = function (apps) {
        localStorageService.set(appsKey, {version: version, apps: apps});
    };

    this.add = function (app) {
        var apps = this.query();
        if (_.filter(apps, function (_app) {return _app.id === app.id;}).length) {
            throw new Error('App already exists.');
        }
        apps.push(app);
        this._save(apps);
    };

    this.remove = function (id) {
        var apps = this.query();
        apps = _.filter(apps, function (_app) {
            if (_app.id === id) {
                return false;
            }
            return true;
        });
        this._save(apps);
    };

    this.get = function (id) {
        var apps = this.query();
        return _.filter(apps, function (app) {
            return app.id === id;
        })[0];
    };

};