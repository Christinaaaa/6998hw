var messages = [], //array that hold the record of each string in chat
	lastUserMessage = "", //keeps track of the most recent input string from the user
	botMessage = "", //var keeps track of what the chatbot is going to say
	botName = 'Chatbot', //name of the chatbot
	talking = true; //when false the speach function doesn't work

$(document).ready(function(){
	// Check whether we are signing in using code or id_token. Otherwise redirect to login page
	if(window.location.href.indexOf("id_token") >= 0){ // Signed in using id_token: this is easier as we can get credentials using id_token directly
		var urlParams = new URLSearchParams(window.location.href.split("#")[1]);
		id_token = urlParams.get("id_token");
		getCredentials(id_token);
	}
	else if(window.location.href.indexOf("code") >= 0){ // Signed in using code: we need to go to oauth2/token to exchange the code for the token
		var urlParams = new URLSearchParams(window.location.search);
		code = urlParams.get("code");
		requestbody = "grant_type=authorization_code&client_id=1kg1oj7shsel6epnic6q5e2bnu&code=" + code + "&redirect_uri=https://s3.amazonaws.com/6998chatbot2/chatbot.html";
		$.ajax({
			url:"https://6998chatbot2.auth.us-east-1.amazoncognito.com/oauth2/token",
			method:"POST",
			header: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			data: requestbody,

			success:function(data){
				access_token = data['access_token'];
				id_token = data['id_token'];
				refresh_token = data['refresh_token'];
				getCredentials(id_token);
			}
		});
	}
	else{ // Not signed in
		window.location.href = "https://6998chatbot2.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id=1kg1oj7shsel6epnic6q5e2bnu&redirect_uri=https://s3.amazonaws.com/6998chatbot2/chatbot.html";
	}
});

function getCredentials(id_token){ // Use id_token to get access key, secret key and session token to generate apigClient
	// Set up AWS Javascript SDK: set the region where your identity pool exists
	AWS.config.region = 'us-east-1'; // Region
	// Exchange the token for credentials, using CognitoIdentityCredentials (internally through AWS STS)
	AWS.config.credentials = new AWS.CognitoIdentityCredentials({
		IdentityPoolId: 'us-east-1:a05063e7-aaea-4298-b774-4e3b668aa206',
		Logins: {
			'cognito-idp.us-east-1.amazonaws.com/us-east-1_G76Ad8Rcw': id_token
		}
	});
	AWS.config.credentials.get(function(){
		// Credentials will be available when this function is called.
		accessKeyId = AWS.config.credentials.accessKeyId;
		secretAccessKey = AWS.config.credentials.secretAccessKey;
		sessionToken = AWS.config.credentials.sessionToken;
		apigClient = apigClientFactory.newClient({ // Cannot use var here as that will create a local variable.
 			apiKey: 'C3CSrn3tGA6jEUwpRRbZ5Lb4Cj95ZVF3FvYaxKn4',
			accessKey: accessKeyId,
			secretKey: secretAccessKey,
			sessionToken: sessionToken
		});
	});
}
  
//edit this function to change what the chatbot says
function chatbotResponse() {
	/*
	talking = true;
	botMessage = "I'm confused"; //the default message

	if (lastUserMessage === 'hi' || lastUserMessage =='hello') {
		const hi = ['hi','howdy','hello']
		botMessage = hi[Math.floor(Math.random()*(hi.length))];;
	}

	if (lastUserMessage === 'name') {
		botMessage = 'My name is ' + botName;
	}
  */
	var params = {
		// This is where any modeled request parameters should be added.
		// The key is the parameter name, as it is defined in the API in API Gateway.
	};

	var body = {
		// This is where you define the body of the request
		/* Schema:
		{
			"messages": [
				{
					"type": "string",
					"unstructured": {
						"id": "string",
						"text": "string",
						"timestamp": "string"
					}
				}
			]
		}	
		*/
		messages: [
			{
				type: "string",
				unstructured: {
					id: accessKeyId, //((messages.length - 1) / 2).toString(),
					text: lastUserMessage,
					timestamp: new Date().getTime().toString()
				}

			}
		]
	};

	var additionalParams = {
		// If there are any unmodeled query parameters or headers that must be
		//   sent with the request, add them here.
	};
  
	apigClient.chatbotPost(params, body, additionalParams)
		.then(function(result){
			// We have to put the results over here because of async
			response_body = JSON.parse(result.data.body)
			botMessage = response_body.messages[0].unstructured.text;
			//add the chatbot's name and message to the array messages
			messages.push("<p><b>" + botName + ":</b> " + botMessage + "</p>");
			// says the message using the text to speech function written below
			Speech(botMessage);
			//outputs the last few array elements of messages to html
			for (var i = 1; i < 8; i++) {
				if (messages[messages.length - i])
			document.getElementById("chatlog" + i).innerHTML = messages[messages.length - i];
			}
		}).catch( function(result){
			//This is where you would put an error callback
			botMessage = "Error: " + result;
		});
}

//this runs each time enter is pressed.
//It controls the overall input and output
function newEntry() {
	//if the message from the user isn't empty then run 
	if (document.getElementById("chatbox").value != "") {
		//pulls the value from the chatbox ands sets it to lastUserMessage
		lastUserMessage = document.getElementById("chatbox").value;
		//sets the chat box to be clear
		document.getElementById("chatbox").value = "";
		//adds the value of the chatbox to the array messages
		messages.push('<p style="text-align:right;"><b>You:</b> ' + lastUserMessage + "</p>");
		//Speech(lastUserMessage);  //says what the user typed outloud
		//sets the variable botMessage in response to lastUserMessage
		chatbotResponse();
	}
}

//text to Speech
//https://developers.google.com/web/updates/2014/01/Web-apps-that-talk-Introduction-to-the-Speech-Synthesis-API
function Speech(say) {
	if ('speechSynthesis' in window && talking) {
		var utterance = new SpeechSynthesisUtterance(say);
		//msg.voice = voices[10]; // Note: some voices don't support altering params
		//msg.voiceURI = 'native';
		//utterance.volume = 1; // 0 to 1
		//utterance.rate = 0.1; // 0.1 to 10
		//utterance.pitch = 1; //0 to 2
		//utterance.text = 'Hello World';
		//utterance.lang = 'en-US';
		speechSynthesis.speak(utterance);
	}
}

//runs the keypress() function when a key is pressed
document.onkeypress = keyPress;
//if the key pressed is 'enter' runs the function newEntry()
function keyPress(e) {
	var x = e || window.event;
	var key = (x.keyCode || x.which);
	if (key == 13 || key == 3) {
		//runs this function when enter is pressed
		newEntry();
	}
	if (key == 38) {
		console.log('hi')
		//document.getElementById("chatbox").value = lastUserMessage;
	}
}

//clears the placeholder text ion the chatbox
//this function is set to run when the users brings focus to the chatbox, by clicking on it
function placeHolder() {
	document.getElementById("chatbox").placeholder = "";
}