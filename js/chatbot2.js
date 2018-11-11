var $messages = $('.messages-content'),
	d, h, m,
	i = 0;

$(window).load(function() {
	$messages.mCustomScrollbar();
	//setTimeout(function() {
	//  chatbotMessage();
	//}, 100);
});

// Note the following will not really work as it will redirect to chatbot.html
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

function updateScrollbar() {
	$messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
		scrollInertia: 10,
		timeout: 0
	});
}

function setDate(){
	d = new Date()
	if (m != d.getMinutes()) {
		m = d.getMinutes();
		$('<div class="timestamp">' + d.getHours() + ':' + m + '</div>').appendTo($('.message:last'));
	}
}

function insertMessage() {
	msg = $('.message-input').val();
	if ($.trim(msg) == '') {
		return false;
	}
	$('<div class="message message-personal">' + msg + '</div>').appendTo($('.mCSB_container')).addClass('new');
	setDate();
	$('.message-input').val(null);
	updateScrollbar();
	setTimeout(function() {
		chatbotMessage(msg);
	}, 1000 + (Math.random() * 20) * 100);
}

$('.message-submit').click(function() {
	insertMessage();
});

$(window).on('keydown', function(e) {
	if (e.which == 13) {
		insertMessage();
		return false;
	}
})

var apigClient = apigClientFactory.newClient({
	apiKey: 'C3CSrn3tGA6jEUwpRRbZ5Lb4Cj95ZVF3FvYaxKn4'
});

function chatbotMessage(msg) {
	if ($('.message-input').val() != '') {
		return false;
	}
	$('<div class="message loading new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure><span></span></div>').appendTo($('.mCSB_container'));
	updateScrollbar();

  
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
					id: accessKeyId, //i.toString(),
					text: msg,
					timestamp: new Date().getTime().toString()
				}

			}
		]
	};

	var additionalParams = {
		// If there are any unmodeled query parameters or headers that must be
		// sent with the request, add them here.
	};
  
	apigClient.chatbotPost(params, body, additionalParams)
		.then(function(result){
			// We have to put the results over here because of async
			response_body = JSON.parse(result.data.body)
			botMessage = response_body.messages[0].unstructured.text;
			setTimeout(function() {
				$('.message.loading').remove();
				$('<div class="message new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure>' + botMessage + '</div>').appendTo($('.mCSB_container')).addClass('new');
				setDate();
				updateScrollbar();
				i++;
			}, 1000 + (Math.random() * 20) * 100);

		}).catch( function(result){
			//This is where you would put an error callback
			botMessage = "Error: " + result;
			setTimeout(function() {
				$('.message.loading').remove();
				$('<div class="message new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure>' + botMessage + '</div>').appendTo($('.mCSB_container')).addClass('new');
				setDate();
				updateScrollbar();
				i++;
			}, 1000 + (Math.random() * 20) * 100);
		});
}