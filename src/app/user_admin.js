/*global dojo, console, plpco, UserAdmin, plpcoglobal, ijit*/
dojo.provide("js.user_admin");

dojo.require("plpco.LogInDialog");
dojo.require("ijit.modules.ErrorLogger");
dojo.require("plpco.UserMenu");
dojo.require("plpco.UserAdmin");

var useradmin;
dojo.declare("UserAdmin", null, {
    // summary:
    //      main module for page
    
    // lDialog: plpco.LogInDialog
    lDialog: null,
    
    // uMenu: plpco.UserMenu
    uMenu: null,
    
    constructor: function() {
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        // global reference
        useradmin = this;
        
        plpco.errorLogger = new ijit.modules.ErrorLogger({
            appName: 'PLPCORoadsViewer'
        });
        
        this.lDialog = new plpco.LogInDialog({isUserAdmin: true}, 'log-in');
        if (this.lDialog.loggedIn) {
            this.afterLogInSuccessful(this.lDialog.email, this.lDialog.role);
        } else {
            dojo.connect(this.lDialog, "onLogInSuccessful", this, 'afterLogInSuccessful');
        }
    },
    afterLogInSuccessful: function(email, role){
        // summary:
        //      Fires after the user successfully logs in
        //      checks to make sure that they are an admin role
        // email: String
        // role: String
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        // get role and confirm that it's admin
        if(role !== plpcoglobal.roleNames.plpcoAdmin) {
            alert('You are not a member of the Admin group!');
            this.lDialog.show();
            return;
        }
        
        this.uMenu = new plpco.UserMenu({
            email: email,
            role: role
        }, 'user-menu');
        
        this.wireEvents();
        
        this.hideLoadingOverlay();
        
        this.getAllWaiting();
    },
    wireEvents: function(){
        // summary:
        //      wires the events for the page
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        var that = this;
        
        dojo.connect(this.uMenu, "onLogOut", function(){
            that.lDialog.clearCookies();
            location.reload();
        });
        
        dojo.connect(dojo.byId('delete-btn'), "onclick", this, 'onDelete');
        dojo.connect(dojo.byId('reset-btn'), "onclick", this, 'onReset');
    },
    hideLoadingOverlay: function(){
        // summary:
        //      hides the loading overlay
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        dojo.fadeOut({
            node: 'loading-overlay',
            onEnd: function(n) {
                dojo.style(n, 'display', 'none');
            }
        }).play();
    },
    getAllWaiting: function () {
        // summary:
        //      fires the get all waiting request and populates the list
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        function onError(msg){
            var span = dojo.byId('none-msg');
            span.innerHTML = "There was an error getting the waiting users: " + msg;
            plpco.errorLogger.log(span.innerHTML);
        }
        
        var that = this;
        var params = {
            url: plpcoglobal.urls.getAllWaiting,
            content: {
                token: plpco.token,
                appName: plpcoglobal.appName
            },
            handleAs: 'json',
            load: function (response) {
                if (response.Status === 200) {
                    that.showQueue(response.Message);
                } else {
                    onError(response.Message);
                }
            },
            error: function (er) {
                onError(er.message);
            }
        };
        dojo.xhrGet(params);
    },
    showQueue: function(users){
        // summary:
        //      loops through the users and create UserAdmin widgets
        // users: Object[]
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        var queueDiv = dojo.byId('queue');
        
        dojo.addClass('loading-image', 'hidden');
        
        if (users.length > 0) {
            dojo.forEach(users, function (user) {
                user.app = this;
                var userAdmin = new plpco.UserAdmin(user, dojo.create('div', null, queueDiv));
            }, this);
        } else {
            dojo.removeClass('none-msg', 'hidden');
        }
    },
    onDelete: function () {
        // summary:
        //      Fires the reject service and deletes the user
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        var email = dojo.byId('delete-email').value;
        var msgSpan = dojo.byId('delete-msg');
        msgSpan.innerHTML = "";
        
        function onError() {
            msgSpan.innerHTML = 'There was a problem deleting the user: ' + email + 
                ' Please check the email address and try again.';
        }
        
        if (email.length > 0) {
            var params = {
                url: plpcoglobal.urls.reject,
                content: {
                    email: email,
                    appName: plpcoglobal.appName,
                    token: plpco.token
                },
                handleAs: 'json',
                load: function (response) {
                    if (response.Status === 200) {
                        msgSpan.innerHTML = email + ' deleted successfully.';
                    } else {
                        onError();
                    }
                },
                error: onError
            };
            dojo.xhrDelete(params);
        }
    },
    onReset: function () {
        // summary:
        //      Fires the reset service
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        
        var email = dojo.byId('reset-email').value;
        var msgSpan = dojo.byId('reset-msg');
        msgSpan.innerHTML = "";
        
        function onError() {
            msgSpan.innerHTML = 'There was a problem resetting the user: ' + email + 
                ' Please check the email address and try again.';
        }
        
        if (email.length > 0) {
            var params = {
                url: plpcoglobal.urls.reset,
                content: {
                    email: email,
                    appName: plpcoglobal.appName,
                    token: plpco.token
                },
                handleAs: 'json',
                load: function (response) {
                    if (response.Status === 200) {
                        msgSpan.innerHTML = email + ' reset successfully.';
                    } else {
                        onError();
                    }
                },
                error: onError
            };
            dojo.xhrPut(params);
        }
    }
});

dojo.ready(function() {
    useradmin = new UserAdmin();
});
