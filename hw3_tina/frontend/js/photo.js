var apigClient = apigClientFactory.newClient({
    apiKey: 'API_KEY'
});

var params = {
    'q' : 'string'
};

var body = {
    
};

var additionalParams = {

};

var messages = [], //array hold the record of each string in chat
lastUserMessage = "" //most recent input string from the user
//botMessage = "", //var keeps track of what chatbot is going to say

function placeHolder() {
    document.getElementById("chatbox").placeholder = "";
}

function showImage(url) {
    var x = document.createElement("img");
    x.setAttribute("src", url);
    x.setAttribute("width", "304");
    x.setAttribute("height", "228");
    x.setAttribute("alt", "text");
    document.body.appendChild(x);
}
function removeImage(){
    var images = document.getElementsByTagName('img');
    for (var i = images.length - 1; i >= 0; i--) {
      images[0].parentNode.removeChild(images[0]);
    }
}

function Response() {
    apigClient.searchGet(params, body, additionalParams)
    .then(function(result){
        // Add success callback code here.
        //response_body = JSON.parse(result);
        //docs = result['data']['results']
        if (result['data'] == "Sorry, can you please repeat that?"){
            alert("Try this: show me dog and cat");
            return 
        }
        arr = result['data']['results'];
        if (arr.length == 0){
            //alert("no images!");
            document.getElementById("msg").innerHTML = "No images";
        }

        for (var i=0; i<arr.length; i++){            
             url = arr[i]['url'];
             console.log(url);
             showImage(url);
         }
  

    }).catch( function(result){
        // Add error callback code here.
        console.log("error");  
    });
    

}

function searchEntry(){
    if (document.getElementById("chatbox").value != "") {
        //pulls the value from the chatbox ands sets it to lastUserMessage
        lastUserMessage = document.getElementById("chatbox").value;
        params['q'] = lastUserMessage;
        console.log(params)
        Response();
    }        

}


document.onkeypress = keyPress;
//if the key pressed is 'enter' runs the function newEntry()
function keyPress(e) {
    var x = e || window.event;
    var key = (x.keyCode || x.which);
    if (key == 13 || key == 3) {
        //runs this function when enter is pressed
        document.getElementById("msg").innerHTML = "";
        $("ul").empty();
        removeImage();
        searchEntry();
    }
    if (key == 38) {
        console.log('hi');
    //document.getElementById("chatbox").value = lastUserMessage;
    }
}
function imageUpload(){
    var f_all = document.querySelector('input[type=file]').files;
    console.log(f_all);
    console.log(f_all[0]);
    console.log(f_all[1]);
    if (f_all['length'] != 0){
        for (var i = 0; i < f_all['length']; i++){
            var f = f_all[i];
            console.log(f.size,f.name, f.type);                     
            var xhr = new XMLHttpRequest(); 
            xhr.open("PUT", "https://tjuj783jt8.execute-api.us-east-1.amazonaws.com/photostagename/upload?name=" + f.name);
            xhr.setRequestHeader("Content-Type", f.type);
            xhr.setRequestHeader("x-api-key", API_KEY);

            xhr.onload = function (event) { 
                console.log(xhr.response);
                //$("ul").append("<li>Uploaded: success" + f.name + "</li>");
                $("ul").append("<li>Upload: success! </li>");

            };
            xhr.send(f);
        }
        
    }
    else{
        alert("No file chosen!");
    }
}

$(document).ready(function() {
     $(".button1").click(function(){
        //alert('clicked');
        $("ul").empty();
        imageUpload();
    });
});
