class AppListController {
    constructor ($rootScope, $interval, $filter, $modal, applicationManager, Notification) {
        this.$rootScope = $rootScope;
        this.$modal = $modal;
        this.$interval = $interval;
        this.$filter = $filter;
        this.manager = applicationManager;
    }

    $onInit() {
        this.listeners = [];
        
        this.order = {
            column: 'name',
            descending: false
        };

        this.loadData();
        
        this.listeners.push(this.$rootScope.$on('frozen', (e, flag) => this.onFrozen(e, flag)));

        this.intervalPromise = this.$interval(() => {
            this.loadData();
        }, 10000);
    }

    $onDestroy() {
        this.$interval.cancel(this.intervalPromise);
    }

    onFrozen(event, flag) {
        if(!flag) {
            this.loadData();
        }
    }

    refresh(app) {
        function createNote(app) {
            var title = app.name + (app.statusInfo.status === 'UP' ? ' is back ' : ' went ') + app.statusInfo.status;
            var options = { tag: app.id,
                body: 'Instance ' + app.id + '\n' + app.healthUrl,
                icon: (app.statusInfo.status === 'UP' ? 'img/ok.png' : 'img/error.png'),
                timeout: 15000,
                url: $state.href('apps.details', {id: app.id}) };
            Notification.notify(title, options);
        }
        
        // app.info = {};
        // app.needRefresh = true;
        //find application in known applications and copy state --> less flickering
        for (var j = 0; this.applications  && j < this.applications.length; j++) {
            if (app.id === this.applications[j].id) {
                app.infoShort = this.applications[j].infoShort;
                app.infoDetails = this.applications[j].infoDetails;
                app.version = this.applications[j].version;
                app.capabilities = this.applications[j].capabilities;
                if (app.statusInfo.status !== this.applications[j].statusInfo.status) {
                    createNote(app); //issue notifiaction on state change
                } else {
                    // app.needRefresh = false; //if state hasn't change don't fetch info
                }
                break;
            }
        }
        if (true) {
            app.refreshing = true;
            app.getCapabilities();
            app.info.then((info) => {
                app.statusInfo.status = 'UP';
                app.version = info.version;
                app.infoDetails = null;
                app.infoShort = '';
                delete info.version;
                var infoYml = this.$filter('yaml')(info);
                if (infoYml !== '{}\n') {
                    app.infoShort = this.$filter('limitLines')(infoYml, 3);
                    if (app.infoShort !== infoYml) {
                        app.infoDetails = this.$filter('limitLines')(infoYml, 32000, 3);
                    }
                }
            }).catch(err => {
                app.statusInfo.status = 'ERROR';
            }).finally(function(){
                app.refreshing = false;
            });
        }
    }

    loadData() {
        this.manager.query().then((applications) => {
            for (var i = 0; i < applications.length; i++) {
                this.refresh(applications[i]);
            }
            this.applications = applications;
        });
    }

    add() {
        this.$rootScope.modalInstance = this.$modal.open({
            template: `<app-editor role="add"></app-editor>`,
            size: 'lg'
        });
    }

    edit(application) {
        this.$rootScope.modalInstance = this.$modal.open({
            template: `<app-editor role="edit" id="${application.id}"></app-editor>`,
            size: 'lg'
        });
    }

    remove(application) {
        application.$remove(function () {
            var index = this.applications.indexOf(application);
            if (index > -1) {
                $scope.applications.splice(index, 1);
            }
        });
    }

    orderBy(column) {
        if (column === this.order.column) {
            this.order.descending = !this.order.descending;
        } else {
            this.order.column = column;
            this.order.descending = false;
        }
    }

    orderByCssClass(column) {
        if (column === this.order.column) {
            return 'sorted-' + (this.order.descending ? 'descending' : 'ascending');
        } else {
            return '';
        }
    }
}

export default {
    controller: AppListController,
    controllerAs: 'list',
    templateUrl: '/components/app_list/app_list.component.html'
}
