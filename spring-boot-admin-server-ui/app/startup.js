import * as angular from 'angular';

angular.module('springBootAdmin', [
    'ngResource',
    'ngRoute',
    'ui.router',
    'ui.bootstrap',
    'LocalStorageModule'
]).config(function ($stateProvider, $urlRouterProvider, $httpProvider, localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix("spring-boot-admin");

    $urlRouterProvider
        .when('/', '/overview')
        .otherwise('/');

    $stateProvider
        .state('overview', {
            url: '/overview',
            templateUrl: 'views/overview.html',
            controller: 'overviewCtrl'
        })
        .state('about', {
            url: '/about',
            templateUrl: 'views/about.html'
        })
        .state('apps', {
            abstract: true,
            url: '/apps/:id',
            controller: 'appsCtrl',
            templateUrl: 'views/apps.html',
            resolve: {
                application: function ($stateParams, Application) {
                    return Application.get({
                        id: $stateParams.id
                    })
                        .$promise;
                }
            }
        })
        .state('apps.details', {
            url: '/details',
            templateUrl: 'views/apps/details.html',
            controller: 'detailsCtrl'
        })
        .state('apps.details.metrics', {
            url: '/metrics',
            templateUrl: 'views/apps/details/metrics.html',
            controller: 'detailsMetricsCtrl'
        })
        .state('apps.details.classpath', {
            url: '/classpath',
            templateUrl: 'views/apps/details/classpath.html',
            controller: 'detailsClasspathCtrl'
        })
        .state('apps.env', {
            url: '/env',
            templateUrl: 'views/apps/environment.html',
            controller: 'environmentCtrl'
        })
        .state('apps.activiti', {
            url: '/activiti',
            templateUrl: 'views/apps/activiti.html',
            controller: 'activitiCtrl'
        })
        .state('apps.logging', {
            url: '/logging',
            templateUrl: 'views/apps/logging.html',
            controller: 'loggingCtrl'
        })
        .state('apps.jmx', {
            url: '/jmx',
            templateUrl: 'views/apps/jmx.html',
            controller: 'jmxCtrl'
        })
        .state('apps.threads', {
            url: '/threads',
            templateUrl: 'views/apps/threads.html',
            controller: 'threadsCtrl'
        })
        .state('apps.trace', {
            url: '/trace',
            templateUrl: 'views/apps/trace.html',
            controller: 'traceCtrl'
        })
        .state('journal', {
            url: '/journal',
            templateUrl: 'views/journal.html',
            controller: 'journalCtrl'
        });
}).run(function ($rootScope, $state) {
    $rootScope.$state = $state;
});
