/**
* Lists of regular expresions that will be used to check if
* the url is an embed or not and show the Embedio button.
*/
embedAuditions = {
  youTube : [
    '^http(?:s)?://(?:[-\\w]+\\.)?youtube\\.com/watch.+$',
    '^http(?:s)?://(?:[-\\w]+\\.)?youtube\\.com/v/.+$'
  ],
  speakerDeck : [
    '^http(?:s)?://speakerdeck\\.com/.+$'
  ],
  codePen : [
    '^http(?:s)?://codepen\\.io/[^#?/]+/pen/.+$'
  ]
};

Embedio = {

  /**
  * Grabs the Url to check if could build an embed from it by
  * filtering from a list of possibilities.
  */
  audit : function(tab, cb) {
    var hostArr = tab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1].split('.'),
      host = hostArr[hostArr.length - 2],
      url = tab.url,
      isEmbed = false;
    switch ( host ) {
      case 'youtube' :
        isEmbed = Embedio.detect(url, embedAuditions.youTube);
        break;
      case 'speakerdeck' :
        isEmbed = Embedio.detect(url, embedAuditions.speakerDeck);
        break;
      case 'codepen' :
        isEmbed = Embedio.detect(url, embedAuditions.codePen)
    }
    if ( isEmbed ) {
      chrome.pageAction.show(tab.id);
      cb({ valid : true, tab : tab });
    } else {
      chrome.pageAction.hide(tab.id);
      cb({ valid : false });
    }
  },


  /**
  * If the url matches a case then audits the url from a lists
  * of convenient tests gotten from the newtwork.
  */
  detect : function(url, list) {
    var size = list.length;
    for ( var i=0; i<size; i++ ) {
      if ( url.match(list[i]) ) return true;
    }
    return false;
  },


  /**
  * Sends the url to the server using Embedio's api. It will
  * build the embed code and save it in the database.
  */
  deliver : function(tab) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://www.rene.mn/api/embeds", true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onreadystatechange = function() {
      if ( xhr.readyState === 4 ) {
        var res = JSON.parse(xhr.responseText),
          notificationId = 'embedio-notification';
        chrome.notifications.create(notificationId, {
          type : 'basic',
          iconUrl : 'icon-save-embed-38.png',
          title : res.status,
          message : res.message
        }, function() {
          setTimeout( function() {
            chrome.notifications.clear(notificationId, function() {});
          }, 3000);
        });
      }
    }
    xhr.send(JSON.stringify({ url : tab.url }));
  }

};

// chrome.webNavigation.onHistoryStateUpdated.addListener(Embedio.audit);
chrome.tabs.onUpdated.addListener( function( tabId, changeInfo, tab) {
  Embedio.audit(tab, function(res) {
    console.log('@ Valid url:', res.valid);
  });
});

chrome.pageAction.onClicked.addListener( function(tab) {
  Embedio.deliver(tab);
});

chrome.commands.onCommand.addListener( function(command) {
  if ( command === 'toggle-feature-foo' ) {
    chrome.tabs.query({ active : true }, function(tab) {
      Embedio.audit(tab[0], function(res) {
        if ( res.valid ) Embedio.deliver(res.tab);
      });
    });
  }
});