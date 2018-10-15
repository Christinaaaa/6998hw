var $messages = $('.messages-content'),
	d, h, m,
	i = 0;

$(window).load(function() {
	$messages.mCustomScrollbar();
	//setTimeout(function() {
	//  chatbotMessage();
	//}, 100);
});

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
					id: i.toString(),
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