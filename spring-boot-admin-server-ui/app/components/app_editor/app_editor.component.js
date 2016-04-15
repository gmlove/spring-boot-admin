/*
 * Copyright 2014 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as _ from 'lodash';

class AppEditorController {
    constructor($rootScope, Application) {
        this.$rootScope = $rootScope;
        this.Application = Application;
    }

    $onInit() {
        this.app = {
            id: '',
            name: '',
            url: '',
            opts: {}
        };

        this.onBodyFrozen(true);
        
        this.showMoreConfig = false;
        this.maxHeight = angular.element(window).height() - 100;
    }

    $onDestroy() {
        this.onBodyFrozen(false);
    }

    onUrlChange({url, opts}) {
        opts.managementUrl = opts.managementUrl || url;
        opts.healthUrl = opts.healthUrl || url + '/health';
        opts.serviceUrl = opts.serviceUrl || url;

        var endpoints = ['health', 'configprops', 'info', 'metrics', 'env', 'env/reset', 'refresh', 'dump', 'trace', 'activiti', 'logfile'];
        _.map(endpoints, function (endpoint) {
            var key = endpoint.replace(/\/\w/, function(s){return s.substr(1).toUpperCase();});
            opts[key + 'Url'] = url + '/' + endpoint;
        });
    }

    toggle(event) {
        event.preventDefault();

        this.showMoreConfig = !this.showMoreConfig;
    }

    onSubmit({url, name, id, opts}) {
        var app = new this.Application(url, name, id, opts);
        this.Application.add(app);
        this.$rootScope.refresh(app);
        this.$rootScope.modalInstance.close();
    }
}

export default {
    controller: AppEditorController,
    controllerAs: 'editor',
    templateUrl: '/components/app_editor/app_editor.component.html'
}
