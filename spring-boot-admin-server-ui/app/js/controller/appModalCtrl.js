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

module.exports = function ($scope, $rootScope, $modal, Application) {
    $scope.app = {
        id: '',
        name: '',
        url: '',
        opts: {}
    };
    
    $rootScope.noScroll = true;
    $scope.showMoreConfig = false;
    $scope.maxHeight = angular.element(window).height() - 100;
    
    $scope.onUrlChange = function(url, opts) {
        opts.managementUrl = opts.managementUrl || url;
        opts.healthUrl = opts.healthUrl || url + '/health';
        opts.serviceUrl = opts.serviceUrl || url;

        var endpoints = ['health', 'configprops', 'info', 'metrics', 'env', 'env/reset', 'refresh', 'dump', 'trace', 'activiti', 'logfile'];
        _.map(endpoints, function (endpoint) {
            var key = endpoint.replace(/\/\w/, function(s){return s.substr(1).toUpperCase();});
            opts[key + 'Url'] = url + '/' + endpoint;
        });
    };

    $scope.toggle = function(event) {
        event.preventDefault();
        
        $scope.showMoreConfig = !$scope.showMoreConfig;
    };
    
    $scope.onSubmit = function(url, name, id, opts) {
        var app = new Application(url, name, id, opts);
        Application.add(app);
        $rootScope.refresh(app);
        $rootScope.modalInstance.close();
    };
    
    $scope.$on('$destroy', function () {
        $rootScope.noScroll = false;
    });
};
