/*global dojo, console, dijit, plpco, plpcoglobal, esri, dojox*/

// provide namespace
dojo.provide("plpco.LogInDialog");

// dojo widget requires
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

// other dojo requires
dojo.require("dijit.Dialog");
dojo.require("dijit.form.Button");
dojo.require("dojox.validate.web");

dojo.declare("plpco.LogInDialog", [dijit._Widget, dijit._Templated], {
    // description:
    //      Provides a form to accept the users credentials and pass them on to the get token
    //      service in ArcGIS Server. The token is then stored in plpco.token for use with
    //      secured services in ArcGIS Server.

    // widgetsInTemplate: [private] Boolean
    //      Specific to dijit._Templated.
    widgetsInTemplate: true,

    // templatePath: [private] String
    //      Path to template. See dijit._Templated
    templatePath: dojo.moduleUrl("plpco", "templates/LogInDialog.html"),

    // baseClass: [private] String
    //    The css class that is applied to the base div of the widget markup
    baseClass: "log-in-dialog",

    // email: String
    email: null,

    // role: String
    role: null,

    // loggedIn: Boolean
    loggedIn: false,

    // registerSuccessMsg: String
    //      The message that is displayed to the user when their registration
    //      was submitted successfully.
    registerSuccessMsg: 'Your registration has been sent to the administrator successfully. You can expect a response within two business days.',

    // registerErrorMsg: String
    registerErrorMsg: 'There was a problem sending your registration information:',
    
    // isUserAdmin: Boolean
    //      see login method
    isUserAdmin: false,

    // Parameters to constructor

    constructor: function(params, div) {
        // summary:
        //    Constructor method
        // params: Object
        //    Parameters to pass into the widget. Required values include:
        // div: String|DomNode
        //    A reference to the div that you want the widget to be created in.
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
    },
    postCreate: function() {
        // summary:
        //    Overrides method of same name in dijit._Widget.
        // tags:
        //    private
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this._wireEvents();

        var token = this.getCookie('token');
        var expires = this.getCookie('tokenexpires');
        var role = this.getCookie('role');

        // the substr plpcoA stuff is to help with upgrade to 0.9. Can be removed in the future.
        if(token && 
            expires && 
            expires > new Date().getTime() && 
            role && 
            role.substr(0, 6) !== 'plpcoA' &&
            this.isUserAdmin === false) {
            plpco.token = token;
            this.addTokenToUrls();
            this.role = role;
            plpco.role = role;
            this.email = this.getCookie('email');
            this.loggedIn = true;
        } else {
            this.dialog.show();
        }
    },
    show: function() {
        // summary:
        //      clears the form and shows it
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.toggleFormDisability(false);
        this.emailBox.value = '';
        this.passwordBox.value = '';
        this.toggleBox(this.alertContainer, false);
        this.clearCookies();
        this.dialog.show();
    },
    _wireEvents: function() {
        // summary:
        //    Wires events.
        // tags:
        //    private
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.connect(this.submitBtn, 'onClick', this.onSubmit);
        this.connect(this.requestBtn, 'onClick', this.onRequest);
        this.connect(this.submitRequestBtn, 'onClick', this.onSubmitRequest);
    },
    onSubmit: function() {
        // summary:
        //      fires when the user clicks the onSubmit button
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        // validate
        if(this.emailBox.value.length === 0) {
            this.alert('Email is required.', 'warning');
            return;
        }
        if(this.passwordBox.value.length === 0) {
            this.alert('Password is required.', 'warning');
            return;
        }

        this.alert('loader', 'success');
        this.toggleFormDisability(true);

        this.login(this.emailBox.value, this.passwordBox.value);
    },
    toggleFormDisability: function(disable) {
        // summary:
        //      sets all of the controls to disabled or enabled
        // disable: Boolean
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.submitBtn.set('disabled', disable);
        this.requestBtn.set('disabled', disable);
        this.emailBox.disabled = disable;
        this.passwordBox.disabled = disable;
    },
    onLogInSuccessful: function(email, role) {
        // summary:
        //      Fires after the user has been successfully logged in
        //      and a plpco-associated role has been found for them.
        // role: String
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        document.cookie = 'role=' + role;
        plpco.role = role;

        this.dialog.hide();
    },
    login: function(email, password) {
        // summary:
        //      description
        // email: String
        // password: String
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.email = email;

        plpco.errorLogger.userName = email;

        var data = {
            request: 'gettoken',
            username: email,
            password: password,
            expiration: 720, // 12 hours
            f: 'json'
        };
        // if this is the user admin page, don't include clientid
        // this is because if the client id is included the token is bound
        // to the domain of the request thus preventing UserManagement from 
        // successfully validating the token
        if (!this.isUserAdmin) {
            data.clientid = (document.domain === 'localhost') ? 'requestip' : 'ref.' + document.domain;
        }
        var params = {
            url: '/ArcGIS_PLPCO/tokens?',
            timeout: 30000,
            content: data,
            handleAs: 'json'
        };
        var that = this;
        dojo.xhrGet(params).then(function(response) {
            if(response.error || !response.token) {
                that.onLogInError(response.error);
                that.toggleFormDisability(false);
            } else {
                // so that people don't have to type in their creds every time they refresh the site.
                // just once per day
                document.cookie = 'token=' + response.token;
                document.cookie = 'tokenexpires=' + response.expires;
                document.cookie = 'email=' + email;

                plpco.token = response.token;

                that.addTokenToUrls();
                that.getRole();
            }
        }, function(e) {
            that.onLogInError(e);
            that.toggleFormDisability(false);
        });
    },
    alert: function(msg, type) {
        // summary:
        //      displays the alert text with the associated status type color
        // msg: String (*|loader)
        // type: String (error|warning|success)
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.styleAlertBox(type);
        this.setAlertBoxContent(msg);
        this.toggleBox(this.alertContainer, true);
    },
    onLogInError: function(er) {
        // summary:
        //      description
        // er: Error Object
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.alert(er.message, 'error');
        this.toggleFormDisability(false);
        if(er.message !== 'Invalid credentials specified.') {
            plpco.errorLogger.log(er);
        }
        this.clearCookies();
    },
    toggleBox: function(node, show) {
        // summary:
        //      shows or hids the alert box
        // show: Boolean
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var f, displayValue, otherValue;
        if(show) {
            f = dojo.fadeIn;
            displayValue = 'block';
            otherValue = 'none';
        } else {
            f = dojo.fadeOut;
            displayValue = 'none';
            otherValue = 'block';
        }
        if(node === this.requestContainer) {
            dojo.style(this.requestBtn.domNode, 'display', otherValue);
        }
        dojo.style(node, 'display', displayValue);
        f({
            node: node
        }).play();
    },
    styleAlertBox: function(style) {
        // summary:
        //      sets the class for the alert box
        // style: String (success|warning|error)
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        dojo.removeClass(this.alertContainer, 'success');
        dojo.removeClass(this.alertContainer, 'warning');
        dojo.removeClass(this.alertContainer, 'error');
        dojo.addClass(this.alertContainer, style);
    },
    setAlertBoxContent: function(msg) {
        // summary:
        //      Sets the text or shows the loading text and image
        // msg: String (*|loader)
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var loaderDisplayValue, txt;
        if(msg === 'loader') {
            loaderDisplayValue = 'block';
            txt = '';
        } else {
            loaderDisplayValue = 'none';
            txt = msg;
        }
        dojo.style(this.loader, 'display', loaderDisplayValue);
        this.alertTxt.innerHTML = txt;
    },
    getRole: function () {
        // summary:
        //      queries for the role of the user
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
        var params, that = this;
        
        function onError(er) {
            that.alert('There was an error getting the role of the user. Tech support has been notified.', 'error');
            plpco.errorLogger.log(er);
            that.clearCookies();
        }
        
        // this.connect(roleTask, 'onComplete', this.onRoleTaskComplete);
        params = {
            url: '/UserManagement/User/GetRoles',
            handleAs: 'json',
            content: {
                email: this.email,
                appName: plpcoglobal.appName,
                token: plpco.token
            }
        };
        
        dojo.xhrGet(params).then(function(response){
            if (response.Status !== 200) {
                onError(response.Message);
            }
            if(dojo.some(response.Message, function(role) {
                return role === plpcoglobal.roleNames.plpcoAdmin;
            })) {
                that.onLogInSuccessful(that.email, plpcoglobal.roleNames.plpcoAdmin);
            } else if(dojo.some(response.Message, function(role) {
                return role === plpcoglobal.roleNames.plpcoSecure;
            })) {
                that.onLogInSuccessful(that.email, plpcoglobal.roleNames.plpcoSecure);
            } else if(dojo.some(response.Message, function(role) {
                return role === plpcoglobal.roleNames.plpcoGeneral;
            })) {
                that.onLogInSuccessful(that.email, plpcoglobal.roleNames.plpcoGeneral);
            } else {
                that.alert('No applicable roles found!', 'error');
                plpco.errorLogger.log({}, 'No roles found for this user');
                that.clearCookies();
                throw new Error('No role found!');
            }
        }, function(er){
            onError(er);
        });
    },
    addTokenToUrls: function() {
        // summary:
        //      Appends all of the secured urls with the token
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        function addToken(url) {
            return url + '/?token=' + plpco.token;
        }

        var urls = plpcoglobal.urls;
        urls.backgroundLayers = addToken(urls.backgroundLayers);
        urls.roadsUrl = addToken(urls.roadsUrl);
        urls.roadsSecureUrl = addToken(urls.roadsSecureUrl);
        urls.maskQueryTaskUrl = addToken(urls.maskQueryTaskUrl);
        urls.rolesUrl = addToken(urls.rolesUrl);
        urls.overlaysUrl = addToken(urls.overlaysUrl);
        urls.attributeTableUrl = addToken(urls.attributeTableUrl);
    },
    getCookie: function(name) {
        // summary:
        //      gets a cookie value
        // returns: String | undefined
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var value;
        if(document.cookie !== "") {
            var cookies = document.cookie.split('; ');

            dojo.forEach(cookies, function(cook) {
                var cv = cook.split('=');
                if(cv[0] === name) {
                    value = cv[1];
                }
            });
        }
        return value;
    },
    clearCookies: function() {
        // summary:
        //      clears all of the log in cookies
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var cookies = document.cookie.split('; ');
        dojo.forEach(cookies, function(cook) {
            var cv = cook.split('=');
            document.cookie = cv[0] + '=expires=Thu, 01 Jan 1970 00:00:00 GMT';
        });
    },
    onRequest: function() {
        // summary:
        //      when the user clicks the request access button
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        this.toggleBox(this.requestContainer, true);
        this.toggleBox(this.alertContainer, false);
    },
    onSubmitRequest: function() {
        // summary:
        //      validates the form and submits the data to the user service
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var that = this;
        function onError(msg) {
            that.alert(that.registerErrorMsg + ' ' + msg, 'error');
            that.toggleBox(that.requestContainer, true);
        }

        this.toggleBox(this.alertContainer, false);
        var content = this.validateRequestForm();
        if(content) {
            this.toggleBox(this.requestContainer, false);
            this.alert('loader', 'success');
            
            content.appName = plpcoglobal.appName;

            var params = {
                url: plpcoglobal.urls.createUser,
                handleAs: 'json',
                content: content
            };

            dojo.xhrPost(params).then(function(response) {
                if(response.Status === 200) {
                    that.alert(that.registerSuccessMsg, 'success');
                } else {
                    onError(response.Message);
                }
            }, function(status) {
                onError(status);
            });
        }
    },
    validateRequestForm: function() {
        // summary:
        //      validates the form and if valid, returns the data.
        //      If not valid then returns false.
        // returns: false | {} object ready to submit to create user service
        console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

        var fName = this.fNameBox.value;
        var lName = this.lNameBox.value;
        var org = this.orgBox.value;
        var email = this.requestEmailBox.value;
        var vEmail = this.verifyEmailBox.value;
        var password = this.requestPasswordBox.value;
        var vPassword = this.verifyPasswordBox.value;
        var values = [['First Name', fName], ['Last Name', lName], ['Organization', org], ['Email', email], ['Verify Email', vEmail], ['Password', password], ['Verify Password', vPassword]];

        var that = this;
        function checkForSomething(name, value) {
            if(value === '' || value === undefined) {
                that.alert(name + ' is required!', 'error');
                return false;
            } else {
                return true;
            }
        }

        var somethingResult = dojo.every(values, function(v) {
            return checkForSomething(v[0], v[1]);
        });
        if(!somethingResult) {
            return false;
        }

        function checkForMatch(value1, value2, name) {
            var match = value1 === value2;
            if(!match) {
                that.alert(name + ' verify does not match', 'error');
                return false;
            } else {
                return true;
            }
        }

        var matchResult = checkForMatch(email, vEmail, 'Email') && checkForMatch(password, vPassword, 'Password');
        if(!matchResult) {
            return false;
        }

        if(!dojox.validate.isEmailAddress(email)) {
            this.alert('Your email address does not appear to be valid!', 'error');
            return false;
        }

        if(password.length < 7) {
            this.alert('Password must be at least 7 characters', 'error');
            return false;
        }

        if(!password.match(/\W/)) {
            this.alert('Password must have at least one non-alphanumeric character', 'error');
            return false;
        }

        return {
            fName: fName,
            lName: lName,
            agency: org,
            email: email,
            password: password
        };
    }
});
