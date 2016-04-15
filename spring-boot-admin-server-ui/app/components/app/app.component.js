class AppController {
    constructor($rootScope) {
        this.$rootScope = $rootScope;
    }

    $onInit() {
        this.scrollable = true;
        this.disposeScrollable = this.$rootScope.$on('frozen', (event, flag) => {
            $rootScope.scrollable = !flag;
        });
    }

    $onDestroy() {
        this.disposeScrollable();
    }
}

export default {
    controller: AppController,
    controllerAs: 'app',
    templateUrl: '/components/app/app.component.html'
}
