/*global dojo, console, dijit, window, alert, plpco, plpcoglobal*/

// provide namespace
dojo.provide("plpco.UserAdmin");

// dojo widget requires
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

// other dojo requires

dojo.declare("plpco.UserAdmin", [dijit._Widget, dijit._Templated], {
	// summary:
	//		A control associated with a user that displays all of the associated
	//		information along with controls for editing their info

	// widgetsInTemplate: [private] Boolean
	//      Specific to dijit._Templated.
	widgetsInTemplate: true,

	// templatePath: [private] String
	//      Path to template. See dijit._Templated
	templatePath: dojo.moduleUrl("plpco", "templates/UserAdmin.html"),

	// baseClass: [private] String
	//		The css class that is applied to the base div of the widget markup
	baseClass: 'user-admin',

	agency: "",
	username: "",
	name: "",
	
	acceptUrl: plpcoglobal.urls.accept,
	rejectUrl: plpcoglobal.urls.reject,

	// Parameters to constructor
	
	// app: plpco.UserAdminPage
	app: null,
	
	constructor: function (params) {
		// summary:
		//      description
		console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
		
		dojo.mixin(this, params);
	},
	postCreate: function () {
		// summary:
		//    Overrides method of same name in dijit._Widget.
		// tags:
		//    private
		console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);

		this._wireEvents();
	},
	_wireEvents: function () {
		// summary:
		//    Wires events.
		// tags:
		//    private
		console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
		var that = this;

		this.connect(this.adminBtn, "onclick", function(){
			that.onAccept(plpcoglobal.roleNames.plpcoAdmin);
		});
		this.connect(this.secureBtn, 'onclick', function(){
			that.onAccept(plpcoglobal.roleNames.plpcoSecure);
		});
		this.connect(this.generalBtn, 'onclick', function() {
			that.onAccept(plpcoglobal.roleNames.plpcoGeneral);
		});
		this.connect(this.rejectBtn, "onclick", this.onReject);
	},
	onReject: function () {
		// summary:
		//      when the user clicks the reject button
		console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
		
		this.disableButtons();

		var result = window.confirm("Are you sure that you want to reject this user?");
		var that = this;
		
		if(result) {
			var params = {
				url: this.rejectUrl,
				content: {
					email: this.username,
					appName: plpcoglobal.appName,
                    token: plpco.token
				},
				handleAs: "json"
			};
			dojo.xhrDelete(params).then(dojo.hitch(this, function(response){
				this.onServerResponse(response, 'reject');
			}), dojo.hitch(this, this.onServerError));
		}
	},
	onAccept: function (role) {
		// summary:
		//		when the user clicks the accept button
		// role: String
		//    The role that the user should be added to
		console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
		
		// disabled buttons to prevent double clicking
		this.disableButtons();
		
		var params = {
			url: this.acceptUrl,
			handleAs: "json",
			content: {
				email: this.username,
				appName: plpcoglobal.appName,
                token: plpco.token,
                role: role
			}
		};
		
		dojo.xhrPut(params).then(dojo.hitch(this, function(response){
			this.onServerResponse(response, 'accept');
		}), dojo.hitch(this, this.onServerError));
	},
	onServerResponse: function (response, type) {
		// summary:
		//      fires when the server response to either an accept or reject
		// response: Object
		//		response from server
		// type: String
		//		The type of operation being performed. accept or reject
		console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
		
		if (response.Status === 200) {
			var backgroundClass = (type === 'accept') ? 'success' : 'error';
			dojo.removeClass(this.domNode, 'info');
			dojo.addClass(this.domNode, backgroundClass);
			var that = this;
			setTimeout(function(){
				that.destroy();
			}, 500);
		} else {
			this.onServerError();
		}
	},
	onServerError: function () {
		// summary:
		//      fires when there is an error
		console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
		
		alert("There was an error with the server!");
	},
	disableButtons: function () {
		// summary:
		//      disabled all buttons in the widget to prevent double-clicking
		console.info(this.declaredClass + "::" + arguments.callee.nom, arguments);
		
		this.generalBtn.disabled = true;
		this.secureBtn.disabled = true;
		this.adminBtn.disabled = true;
		this.rejectBtn.disabled = true;
	}
});