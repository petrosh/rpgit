//
// DECLARATIONS
//
var token = '';
var url = '';
var pathArray = window.location.host.split( '.' ); // pathArray[0]
var pathSlash = window.location.pathname.split( '/' ); // pathSlash[1]
var pathHash = window.location.hash.substring( 1 ); // Drop #
var username = pathArray[0];
var reponame = pathSlash[1];
var alert = document.getElementById( "alert" );

var thisRepository = {},
    systemRepository = {},
    systemRepositoryName = '',
    systemSha = '';

var settings = {};
//
// CHECK login
//
if ( localStorage.getItem( 'rpgit.player.token' ) ) {
  token = atob( localStorage.getItem( 'rpgit.player.token' ) );
  url = "https://api.github.com/repos/" + username + "/" + reponame;
  getAPI( url, repo, error, {} );
} else {
  // LOGIN
  // window.location = 'login.html';
  document.getElementById( "login" ).style.display = "block";
  document.getElementById( "submitLogin" ).addEventListener('click', function(e) {
    e.preventDefault();
    token = tokenfield.value;
    if (token) {
      but.setAttribute("disabled", "true");
      getAPI( "https://api.github.com", auth, noauth, {} );
    }
  });
}

function auth(){
  localStorage.setItem("rpgit.player.token", btoa(token));
  alert.innerHTML = "Authorized. <a href='index.html'>Proceed</a>";
}

function noauth(){
  alert.innerHTML = "Wrong token, retry.";
  but.removeAttribute("disabled");
  tokenfield.value = '';
  tokenfield.focus();
  console.warn(this);
}

function repo(){
  thisRepository = JSON.parse( this.responseText );
  etag = this.getResponseHeader( "ETag" ).replace( /^[W/"]{1,}|."/g, "" );

  // ORGANIZATION
  if( thisRepository.owner.type == "Organization" ){
    date = formatDate( thisRepository.created_at );
    monitor( "game started", date );
    monitor( "players", thisRepository.forks );
    if(thisRepository.permissions.admin === true){
      // GM connected
      url = "https://api.github.com/repos/" + username + "/" + reponame + "/pulls";
      getAPI( url, pulls, error, {} );
    }else{
      // Guest player
    }
  }

  // PLAYER
  if( thisRepository.owner.type == "User" ){
    date = formatDate( thisRepository.created_at );
    if( thisRepository.permissions.admin === true ){
      monitor( "joined game", date );
      // Player connected
      systemRepository = thisRepository.parent;
      systemRepositoryName = systemRepository.full_name;
      systemUrl = "http://" + systemRepository.owner.login + ".github.io/" + systemRepository.name ;
      monitor( 'parent', '<a href="' + systemUrl + '">link</a>' );
      url = "https://api.github.com/repos/" + systemRepositoryName + "/git/refs/heads/master";
      getAPI( url, systemRef, error, {} );
    }else{
      // Player in wrong page
      var systemUrl = thisRepository.parent.html_url;
      alert.innerHTML = "You don&apos;t own this player repository, <a href='" + systemUrl + "'>fork</a> you own copy";
    }
  }

}

function  pulls(){
  pullList = JSON.parse( this.responseText );
  console.info( 'pulls: ' + pullList.length );
  if( pullList.length !== 0 ){
    monitor( "pending", "<a href='" + thisRepository.html_url + "/pulls'>" + pullList.length + ' pulls</a>' );
  }else{
    monitor( "pending", "no pulls" );
  }
  url = "https://api.github.com/repos/" + username + "/" + reponame + "/contents/settings.json";
  getAPI( url, gmSettings, gmNosettings, '{"ref":"master"}' );
}

function gmSettings(){
  var resp = JSON.parse( this.responseText );
  console.info( resp );
  // proceed with settings
}

function gmNosettings(){
  if( this.status == 404 ){
    console.log( 'create one' );
    url = "https://api.github.com/repos/" + username + "/" + reponame + "/contents/settings_schema.json";
    getAPI( url, settingSchema, error, '{"ref":"master"}' );
  }
}

function settingSchema(){
  var resp = JSON.parse( this.responseText );
  var jsonSchema = JSON.parse( atob( resp.content ) );
  document.getElementById( "settings" ).style.display = "block";
  var editor = new JSONEditor(document.getElementById('editor_holder'),{
    schema: jsonSchema,
    disable_properties: true,
    disable_edit_json: true
  });
  document.getElementById( 'submit' ).addEventListener( 'click', function() {
    console.table( editor.getValue() );
  });
  // proceed with new settings
}

function  systemRef(){
  var resp = JSON.parse( this.responseText );
  systemSha = resp.object.sha;
  url = "https://api.github.com/repos/" + username + "/" + reponame + "/git/refs/heads/master";
  getAPI( url, playerRef, error, {} );
}

function  playerRef(){
  var resp = JSON.parse( this.responseText );
  playerSha = resp.object.sha;
  if( playerSha == systemSha ){
    monitor( 'status', 'updated ' + playerSha );
    checkSettings();
  }else{
    monitor( 'status', 'need update from ' + playerSha + ' -> ' + systemSha );
    update();
  }
}

function checkSettings(){
  url = "https://api.github.com/repos/" + username + "/" + reponame + "/contents/settings.json";
  getAPI( url, plaSettings, plaNosettings, '{"ref":"master"}' );
}

function plaSettings(){
  settings.player = JSON.parse( this.responseText );
  checkPlayer();
}

function plaNosettings(){
  alert.innerHTML = "waiting for settings";
}

function update(){
  url = "https://api.github.com/repos/" + username + "/" + reponame + "/git/refs/heads/master";
  getPATCH( url, playerRef, error, '{"sha":"' + systemSha + '"}' );
}

function checkPlayer(){
  url = "https://api.github.com/repos/" + username + "/" + reponame + "/contents/players/" + username + ".json";
  getAPI( url, isPlayer, noPlayer, '{"ref":"master"}' );
}

function isPlayer(){
  var resp = JSON.parse( this.responseText );
  console.log(resp);
  // proceed with player
}

function noPlayer(){
  // create player
}

function error(){
  alert.innerHTML = "Error";
  console.warn(this);
}

function formatDate( isoDate ){
  var date = new Date( isoDate );
  return date.toLocaleDateString();
}

function monitor( name, data ){
  var listItem = document.createElement( 'li' );
  listItem.innerHTML = name + ": " + data;
  document.getElementById( "monitor" ).appendChild( listItem );
}

// XHR REQUEST
function getAPI( url, callback, fallback, headers ) {
  var xhr = new XMLHttpRequest();
  xhr.open ( "GET", url, true );
  xhr.setRequestHeader( 'Accept', 'application/vnd.github.v3.full+json' );
  xhr.setRequestHeader( 'Authorization', 'token ' + token );
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

function getPATCH( url, callback, fallback, headers ) {
  var xhr = new XMLHttpRequest();
  xhr.open ( "PATCH", url, true );
  xhr.setRequestHeader( 'Accept', 'application/vnd.github.v3.patch' );
  xhr.setRequestHeader( 'Authorization', 'token ' + token );
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
  xhr.send( headers );
}
