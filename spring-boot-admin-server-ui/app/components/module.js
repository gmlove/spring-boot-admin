import * as angular from 'angular';

import App from './app/app.component';
import AppList from './app_list/app_list.component';
import AppEditor from './app_editor/app_editor.component';


angular.module('springBootAdmin')
    .component('app', App)
    .component('appList', AppList)
    .component('appEditor', AppEditor);
