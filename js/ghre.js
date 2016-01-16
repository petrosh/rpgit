//
// DECLARATIONS
//

var token = '';
var pathArray = window.location.host.split( '.' ); // pathArray[0]
var pathSlash = window.location.pathname.split( '/' ); // pathSlash[1]
var pathHash = window.location.hash.substring( 1 ); // Drop #
var username = pathArray[0], username = "Fork-n-Play";
var reponame = pathSlash[1], reponame = "rpgit";
var alert = document.getElementById( "alert" );

//
// getAPI https://developer.github.com/v3/#authentication
//

function getAPI( url, callback, fallback, headers ) {
  var xhr = new XMLHttpRequest();
  xhr.open ( "GET", url + "?access_token=" + token, true );
  xhr.setRequestHeader( 'Accept', 'application/vnd.github.v3.full+json' );
  // for (var i = 0; i < headers.length; i++) {
  //   xhr.setRequestHeader(headers[i]);
  // }
  xhr.onreadystatechange = function() {
    // 2xx Success
    if ( xhr.readyState == 4 && xhr.status == 200 ) {
      if (typeof callback == "function") {
        console.log( 'remaining: ' + xhr.getResponseHeader( "X-RateLimit-Remaining" ) );
        callback.apply( xhr );
      }
    }
    // 4xx Client Error
    if ( xhr.readyState == 4 && xhr.status >= 400 ) {
      // 400 Bad Request
      // 401 Unauthorized
      // 403 Forbidden
      // 404 Not Found
      if ( typeof fallback == "function" ) {
        fallback.apply( xhr );
      }
    }
  };
  xhr.send();
}
