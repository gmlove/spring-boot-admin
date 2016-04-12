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

module.exports = function ($scope, $rootScope, $modal, Application) {
    $scope.app = {
        id: '',
        name: '',
        url: ''
    };
    
    $scope.onSubmit = function(url, name, id) {
        console.log(url, name, id);
        var app = new Application(url, name, id);
        Application.add(app);
        $rootScope.refresh(app);
        $rootScope.modalInstance.close();
    }
};
