## Angular Google Cloud Messaging

Angular-gcm is a simple directive allowing users to subscribe to Google Cloud Messaging API by clicking a button.

## Setup

### Obtaining GCM Keys

<img src="http://images.google.com/intl/en_ALL/images/srpr/logo6w.png" width="150">
- Select your project
- Then select *APIs & auth* from the sidebar and click on *Credentials* tab
- Click **CREATE NEW Key** button
 - **Server Key**
- Again click **CREATE NEW Key** button
 - **Browser Key**

### Add GCM to your project

#### Installing via Bower

```
bower install angular-gcm
```

#### Edit/Place files

 - Place `manifest.json` on your root domain and change the `gcm_sender_id` by the id of your project:

```javascript
  "gcm_sender_id": "my_project_id",
```

 - Add `<link rel="manifest" href="manifest.json">` on the header of your index.html :

```html
<head>
	...
    <link rel="manifest" href="manifest.json">
    ...
```

 - Place `service-worker.json` on your root domain and edit it to suite you needs.

 - Declare `angular-gcm.js` script.

### Use it

In your template :

```html
<gcm callback="gcmSend" gcmapikey="'your_gcm_client_key'"></gcm>
```

or
```html
<!-- activate = button text to enable notifications -->
<!-- disable = button text to disable notifications -->
<gcm callback="gcmSend" activate="'Enable notif'" disable="'Disable notif'" gcmapikey="'your_gcm_client_key'"></gcm>
```
In your controller :

```javascript
		$scope.gcmSend = function(sub) {
			// send token to server and save it
			$http.post('your_server_url', {"token" : sub.subscriptionId})
			...
		}
```

***note : you need to have an https website to allow users to subscribe***

On the server side you must call the Google Cloud Messaging API using the POSTed subscriber token to send a notification :

```javascript
curl --header "Authorization: key=your_server_key"
--header Content-Type:"application/json"
https://android.googleapis.com/gcm/send
-d "{\"registration_ids\":[\"subscriber_token\"]}"
```

Google GCM Doc : https://developers.google.com/cloud-messaging/