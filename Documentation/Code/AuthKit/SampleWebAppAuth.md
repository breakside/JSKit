Integrating OAuth into your web based `UIKit` application can be done easily
thanks to rich features of `UIKit` and `AuthKit`.

All of our sample code will be contained to the `ApplicationDelegate` class and
the application's `Info` file.

Sending the User to the Authentication URL
---------------------
Starting with the `ApplicationDelegate`, we'll create a method that sends the
user to Google for authentication.

`ApplicationDelegate.js`
````
// #import UIKit
// #import AuthKit
// #import SecurityKit
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    showGoogleAuth: function(){
        // Load the Google OAuth service 
        OAService.google.load(function(){

            // Create a new OAuth Sesssion
            var clientId = JSBundle.mainBundle.info.GoogleOAuthClientId;
            var session = OASession.initWithService(OAService.google, clientId);

            // Configure the session to redirect back to this app
            // with a JSON Web Token 
            session.redirectURL = UIApplication.shared.baseURL;
            session.responseTypes = ['id_token'];

            // Save the unique state in JSUserDefaults so we can check it
            // when the user is redirected back here
            JSUserDefaults.shared.setValueForKey("oauth", {state: session.state});

            // Open Google auth in the current tab/window, replacing this
            // application, because we'll be redirected back when the auth is done
            UIApplication.shared.openURL(session.authenticationURL, {replacingApplication: true});

        }, this);
    },

});
````

Adding Custom Properties to Info.yaml
-----------------------------------
The redirect code will almost work as-is, but it gets its `clientId`() from
the application's `Info` file, so we need to make sure the id is actually there.

`Info.yaml`
````
JSBundleType:               html
JSBundleIdentifier:         com.example.OAuthDemo
JSBundleVersion:            1.0.0
UIApplicationTitle:         .applicationTitle
UIApplicationDelegate:      ApplicationDelegate
UIApplicationLaunchOptions:
  uistate:  {kind: positional, default: null}
  others:   {kind: unknown}
UIApplicationSystemFont:    SourceSansPro-Light
JSDevelopmentLanguage:      en

# Custom property to support OAuth
GoogleOAuthClientId:        1234567890987654321-abcdefedcba.apps.googleusercontent.com
````

When to send the User
---------------------
Now that we have a method to send the user to Google for authentication, we
need to pick a time to send them there.

For the purposes of this tutorial, we'll just send them there when the app
launches.

*Of course, most apps will not want to redirect immedately to a specific sign
in service, but would perhaps show a login view with options for different
signin services.  We'll leave that UI work for another tutorial, and focus here
on the OAuth aspects.*

`ApplicationDelegate.js`
````
JSClass("ApplicationDelegate", JSObject, {

    applicationDidFinishLaunching: function(application, launchOptions){
      this.showGoogleAuth();
    },

    showGoogleAuth: function(){
      // ...
    },

});
````

Handling the Redirect After Auth
---------------------
When we send the user to Google, we ask to be redirected back to the app's
URL one the authentication is complete.

When that redirect happens, the app will launch all over again.

Of course, we just coded the app to always go to Google on launch, which is
obviously incomplete.  Lets make some changes to handle the response from
Google.

Google sends its response as key/values in the fragment part of the URL.
Specifically, it will look something like:

````
#state=abc123&id_token=abc...
````

`UIApplication` looks to the fragment for any options that have been defined
in the `UIApplicationLaunchOptions` dictionary of the applications `Info`.

So we need to add a couple launch options:

`Info.yaml`
````
# ...
UIApplicationLaunchOptions:
  uistate:  {kind: positional, default: null}
  others:   {kind: unknown}

  # Launch Options for OAuth
  state:    {default: null}
  id_token: {default: null}

# ...
````

The new `state`() and `id_token`() launch options have `null` defaults so they
aren't considered required.

Now, in `ApplicationDelegate`, we'll adjust `applicationDidFinishLaunching`()
to check for the `state`() and `id_token` launch options.  If they are present,
it means we're handling an OAuth redirect.

`ApplicationDelegate.js`
````
JSClass("ApplicationDelegate", JSObject, {

    applicationDidFinishLaunching: function(application, launchOptions){
      if (launchOptions.state !== null && launchOptions.id_token !== null){
        this.loginWithOAuthResponse(launchOptions.state, launchOptions.id_token);
      }else{
        this.showGoogleAuth();
      }
    },

    showGoogleAuth: function(){
      // ...
    },

});
````

Checking the OAuth Response
--------
We've declared a new method, `loginWithOAuthResponse()` that needs to be
implemented.

It needs to verify that the response is legitimate.

`ApplicationDelegate.js`
````
JSClass("ApplicationDelegate", JSObject, {

    applicationDidFinishLaunching: function(application, launchOptions){
      if (launchOptions.state !== null && launchOptions.id_token !== null){
        this.loginWithOAuthResponse(launchOptions.state, launchOptions.id_token);
      }else{
        this.showGoogleAuth();
      }
    },

    loginWithOAuthResponse: function(state, jsonWebTokenString){
      // First, check that the state matches what we saved before sending
      // the user to Google.  This verifies it's an expected response
      var savedState = JSUserDefaults.shared.valueForKey("oauth");
      if (state !== savedState){
        // State is not valid
        // Show an error, continue loading as normal, or whatever behavior you'd like
        return;
      }
      JSUserDefaults.shared.setValueForKey("oauth", null);

      // Second, verify the JSON Web Token is valid
      OAService.google.load(function(){
        OAService.google.keys(function(publicKeys){
          var token = SECJSONWebToken.initWithString(jsonWebTokenString);
          token.verifiedPayload(publicKeys, function(user){
            if (user === null){
              // JSON Web Token is not valid
              // Show an error, continue loading as normal, or whatever behavior you'd like
              return;
            }
            // Show logged-in UI for user
          }, this);
        }, this)
      }, this);
    },

    showGoogleAuth: function(){
      // ...
    },

});
````