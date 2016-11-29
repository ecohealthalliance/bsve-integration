// The first two slashes are http://, so the third - if present - is the path.
// The host is everything before the path.
var APP_HOST = APP_URL.split("/").slice(0,3).join("/")
var iframe = document.querySelector('iframe');
iframe.src = APP_URL;
BSVE.init(function() {
  BSVE.api.exchange.receive(function(data) {
    var link = data.Link || data.link;
    var content = data.Content || data.content;

    var searchPattern = new RegExp('^(Unable to extract content|Loading full article|false)');
    if (searchPattern.test(content)) {
      content = '';
    }

    console.log(">Content: " + content);
    console.log(">Link:" + link);

    var obj = {
      type: "eha.dataExchange",
      content: content,
      link: link
    };

    iframe.contentWindow.postMessage(JSON.stringify(obj), APP_HOST);
  });
  //The dossierbar create handler will send a eha.dossierRequest message
  //to the child iframe and expect a eha.dossierTag message in response.
  BSVE.ui.dossierbar.create(function(status, ctx){
    iframe.contentWindow.postMessage(JSON.stringify({type: "eha.dossierRequest"}), APP_HOST);
    var tagPromise = new Promise(function(resolve){
      window.addEventListener("message", function handler(event){
        if(event.origin !== APP_HOST) return;
        try {
          var message = JSON.parse(event.data);
        } catch(e) {
          return;
        }
        if(message.type === "eha.dossierTag") {
          resolve(message);
          window.removeEventListener("message", handler);
        }
      }, false);
    });
    tagPromise.then(function(message){
      var description = "";
      if(message.html) {
        description = message.html;
      } else if(message.screenCapture) {
        description = '<img src="' + message.screenCapture + '"/><br /><a target="_blank" href="' + message.url + '">Link</a>';
      }
      BSVE.api.tagItem({
        title: message.title,
        dataSource: APP_NAME,
        sourceDate: (new Date()).toISOString().split("T")[0],
        itemDetail: {
          statusIconType: "Text",
          Description: description
        }
      }, status, function(result){
        console.log("dossier tagging complete", result);
      });
    });
  });
  //eha.authRequest allows child windows to request authentication info
  //in the form of a eha.authInfo message from the parent frame in order
  //to communicate directly with the BSVE API.
  window.addEventListener("message", function handler(event){
    if(event.origin !== APP_HOST) return;
    try {
      var message = JSON.parse(event.data);
    } catch(e) {
      return;
    }
    if(message.type === "eha.authRequest") {
      var obj = {
        type: "eha.authInfo",
        user: BSVE.api.user(),
        userData: BSVE.api.userData(),
        authTicket: BSVE.api.authTicket()
      };
      iframe.contentWindow.postMessage(JSON.stringify(obj), APP_HOST);
    }
  }, false);
});
