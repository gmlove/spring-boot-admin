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
    constructor($rootScope, applicationManager) {
        this.$rootScope = $rootScope;
        this.manager = applicationManager;
    }

    $onInit() {
        switch (this.role) {
            case 'add':
                this.app = this.manager.create();
                this.config = this.app.editableConfig;
                this.isIdEditable = true;
                break;

            case 'edit':
                this.manager.get(this.id).then(app => {
                    this.app = app;
                    this.config = app.editableConfig
                });
                this.isIdEditable = false;
                break;

            default:
                throw new Error('Role is illegal.');
        }
        
        this.$rootScope.$broadcast('frozen', true);
        
        this.showMoreConfig = false;
        this.endpoints = this.manager.endpoints;
        this.maxHeight = angular.element(window).height() - 100;
    }

    $onDestroy() {
        this.$rootScope.$broadcast('frozen', false);
    }

    onUrlChange(config) {
        this.endpoints.forEach(endpoint => {
            config[endpoint.key] = this.manager.getDefaultUrl(endpoint, config.url);
        });
    }

    toggle(event) {
        event.preventDefault();

        this.showMoreConfig = !this.showMoreConfig;
    }

    onSubmit() {
        if(this.app.$save()) {
            this.$rootScope.modalInstance.close();
        }
    }
}

export default {
    controller: AppEditorController,
    controllerAs: 'editor',
    templateUrl: 'components/app_editor/app_editor.component.html',
    bindings: {
        role: '@',
        id: '@'
    }
}
