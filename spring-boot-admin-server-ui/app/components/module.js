import * as angular from 'angular';

import App from './app/app.component';
import AppEditor from './app_editor/app_editor.component';


angular.module('springBootAdmin')
    .component('app', App)
    .component('appEditor', AppEditor);
