class AppController {
    constructor($rootScope) {
        this.$rootScope = $rootScope;
    }

    $onInit() {
        this.listeners = [];
        
        this.$rootScope.scrollable = true;
        this.listeners.push(this.$rootScope.$on('frozen', (e, flag) => this.onFrozen(e, flag)));
    }

    $onDestroy() {
        this.listeners.forEach(fn => fn());
    }
    
    onFrozen(event, flag) {
        this.$rootScope.scrollable = !flag;
    }
}

export default {
    controller: AppController,
    controllerAs: 'app',
    templateUrl: '/components/app/app.component.html'
}
