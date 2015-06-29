(function(angular) {
  'use strict';
  angular.module('angular-gcm', [])
    .directive('gcm', function() {
      return {
        restrict: 'E',
        scope: {
          callback: '=',
          activate: '=',
          disable: '=',
          gcmAPIKey: '=gcmapikey'
        },
        template: '<button class="btn btn-block btn-primary" id="gcm-button"></button>',
        link: function(scope, element, attr) {
          var activate = scope.activate || 'Enable notifications';
          var disable = scope.disable || 'Disable notifications';
          var pushButton = element.find('button')[0];
          pushButton.textContent = activate;

          window.GoogleSamples = window.GoogleSamples || {};
          window.GoogleSamples.Config = window.GoogleSamples.Config || {
            gcmAPIKey: scope.gcmAPIKey
          };


          var API_KEY = scope.gcmAPIKey;
          var GCM_ENDPOINT = 'https://android.googleapis.com/gcm/send';
          var isPushEnabled = false;

          function endpointWorkaround(pushSubscription) {
            // Make sure we only mess with GCM
            if (pushSubscription.endpoint.indexOf('https://android.googleapis.com/gcm/send') !== 0) {
              return pushSubscription.endpoint;
            }

            var mergedEndpoint = pushSubscription.endpoint;
            // Chrome 42 + 43 will not have the subscriptionId attached
            // to the endpoint.
            if (pushSubscription.subscriptionId &&
              pushSubscription.endpoint.indexOf(pushSubscription.subscriptionId) === -1) {
              // Handle version 42 where you have separate subId and Endpoint
              mergedEndpoint = pushSubscription.endpoint + '/' +
                pushSubscription.subscriptionId;
            }
            return mergedEndpoint;
          }

          function sendSubscriptionToServer(subscription) {
            // TODO: Send the subscription.endpoint
            // to your server and save it to send a
            // push message at a later date
            //
            // For compatibly of Chrome 43, get the endpoint via
            // endpointWorkaround(subscription)

            var mergedEndpoint = endpointWorkaround(subscription);

            // This is just for demo purposes / an easy to test by
            // generating the appropriate cURL command
            scope.callback(subscription);
          }

          function unsubscribe() {
            var pushButton = element.find('button')[0];
            pushButton.disabled = true;

            navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
              // To unsubscribe from push messaging, you need get the
              // subcription object, which you can call unsubscribe() on.
              serviceWorkerRegistration.pushManager.getSubscription().then(
                function(pushSubscription) {
                  // Check we have a subscription to unsubscribe
                  if (!pushSubscription) {
                    // No subscription object, so set the state
                    // to allow the user to subscribe to push
                    isPushEnabled = false;
                    pushButton.disabled = false;
                    pushButton.textContent = activate;
                    return;
                  }

                  // TODO: Make a request to your server to remove
                  // the users data from your data store so you
                  // don't attempt to send them push messages anymore

                  // We have a subcription, so call unsubscribe on it
                  pushSubscription.unsubscribe().then(function(successful) {
                    pushButton.disabled = false;
                    pushButton.textContent = activate;
                    isPushEnabled = false;
                  }).catch(function(e) {
                    // We failed to unsubscribe, this can lead to
                    // an unusual state, so may be best to remove
                    // the subscription id from your data store and
                    // inform the user that you disabled push

                    console.log('Unsubscription error: ', e);
                    pushButton.disabled = false;
                  });
                }).catch(function(e) {
                console.log('Error thrown while unsubscribing from ' +
                  'push messaging.', e);
              });
            });
          }
          function subscribe() {
            // Disable the button so it can't be changed while
            // we process the permission request
            var pushButton = element.find('button')[0];
            pushButton.disabled = true;

            navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
              serviceWorkerRegistration.pushManager.subscribe({
                  userVisibleOnly: true
                })
                .then(function(subscription) {
                  // The subscription was successful
                  isPushEnabled = true;
                  pushButton.textContent = disable;
                  pushButton.disabled = false;

                  // TODO: Send the subscription subscription.endpoint
                  // to your server and save it to send a push message
                  // at a later date
                  return sendSubscriptionToServer(subscription);
                })
                .catch(function(e) {
                  if (Notification.permission === 'denied') {
                    // The user denied the notification permission which
                    // means we failed to subscribe and the user will need
                    // to manually change the notification permission to
                    // subscribe to push messages
                    console.log('Permission for Notifications was denied');
                    pushButton.disabled = true;
                  } else {
                    // A problem occurred with the subscription, this can
                    // often be down to an issue or lack of the gcm_sender_id
                    // and / or gcm_user_visible_only
                    console.log('Unable to subscribe to push.', e);
                    pushButton.disabled = false;
                    pushButton.textContent = 'Activer les notifications';
                  }
                });
            });
          }

          // Once the service worker is registered set the initial state
          function initialiseState() {
            // Are Notifications supported in the service worker?
            if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
              console.log('Notifications aren\'t supported.');
              return;
            }

            // Check the current Notification permission.
            // If its denied, it's a permanent block until the
            // user changes the permission
            if (Notification.permission === 'denied') {
              console.log('The user has blocked notifications.');
              return;
            }

            // Check if push messaging is supported
            if (!('PushManager' in window)) {
              console.log('Push messaging isn\'t supported.');
              return;
            }

            // We need the service worker registration to check for a subscription
            navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
              // Do we already have a push message subscription?
              serviceWorkerRegistration.pushManager.getSubscription()
                .then(function(subscription) {
                  // Enable any UI which subscribes / unsubscribes from
                  // push messages.
                  var pushButton = element.find('button')[0];
                  pushButton.disabled = false;

                  if (!subscription) {
                    // We aren’t subscribed to push, so set UI
                    // to allow the user to enable push
                    return;
                  }

                  // Keep your server in sync with the latest subscription
                  sendSubscriptionToServer(subscription);

                  // Set your UI to show they have subscribed for
                  // push messages
                  pushButton.textContent = disable;
                  isPushEnabled = true;
                })
                .catch(function(err) {
                  console.log('Error during getSubscription()', err);
                });
            });
          }

          element.on('mousedown', function(event) {
            if (isPushEnabled) {
              unsubscribe();
            } else {
              subscribe();
            }
          });

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
              .then(initialiseState);
          } else {
            console.log('Service workers aren\'t supported in this browser.');
          }

        }
      };
    });
})(window.angular);