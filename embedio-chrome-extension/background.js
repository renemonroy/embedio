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
  ]
};

Embedio = {

  /**
  * Grabs the Url to check if could build an embed from it by
  * filtering from a list of possibilities.
  */
  audit : function(details) {
    var hostArr = details.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1].split('.'),
      host = hostArr[hostArr.length - 2],
      url = details.url,
      isEmbed = false;
    switch ( host ) {
      case 'youtube' :
        isEmbed = Embedio.detect(url, embedAuditions.youTube);
        break;
      case 'speakerdeck' :
        isEmbed = Embedio.detect(url, embedAuditions.speakerDeck);
        break;
    }
    if ( isEmbed ) Embedio.enableDelivery(details.tabId);
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
  * This function only shows the Deliver button that will be
  * located in browser's url/search bar.
  */
  enableDelivery : function(id) {
    chrome.pageAction.show(id);
  },


  /**
  * Sends the url to the server using Embedio's api. It will
  * build the embed code and save it in the database.
  */
  deliver : function(tab) {
    console.log('@ Delivering url:', tab.url);
    // xhr request...
  }

};

chrome.webNavigation.onHistoryStateUpdated.addListener(Embedio.audit);
chrome.pageAction.onClicked.addListener(Embedio.deliver);