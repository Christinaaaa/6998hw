import json
import boto3

""" --- Functions that control the bot's behavior --- """
def dining_suggestions(intent_request):
    location = intent_request['currentIntent']['slots']['Location']
    cuisine = intent_request['currentIntent']['slots']['Cuisine']
    dining_time = intent_request['currentIntent']['slots']['DiningTime']
    number_of_people = intent_request['currentIntent']['slots']['NumberOfPeople']
    phone_number = intent_request['currentIntent']['slots']['PhoneNumber']
    
    # Create SQS client
    sqs = boto3.client('sqs')
    queue_url = 'https://sqs.us-east-1.amazonaws.com/496832576384/DiningConciergeQueue'
    # Send message to SQS queue
    queue_response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(intent_request['currentIntent']['slots'])
    )
    
    response_content = "Your request has been fulfilled. You want a " + cuisine + " restaurant at " + location + " at time " + dining_time + " with " + number_of_people + " people. Your results will be sent to phone number " + phone_number + "."
    response = {
        "dialogAction": {
            "type": "Close",
            "fulfillmentState": "Fulfilled",
            "message": {
                "contentType": "PlainText",
                "content": response_content
            }
        }
    }
    #return queue_response
    return response

# Validate 
def validate(intent_request):
    slots = intent_request['currentIntent']['slots']
    location = intent_request['currentIntent']['slots']['Location']
    cuisine = intent_request['currentIntent']['slots']['Cuisine']
    dining_time = intent_request['currentIntent']['slots']['DiningTime']
    number_of_people = intent_request['currentIntent']['slots']['NumberOfPeople']
    phone_number = intent_request['currentIntent']['slots']['PhoneNumber']
    
    locations = ["New York", "Chicago", "San Francisco", "Los Angeles"]
    cuisines = ["Chinese", "Indian", "Korean", "Fast food", "Halal", "Thai", "Formal", "Japanese"]
    
    if location and location not in locations:
        response_content = "Location is not valid. Valid locations: " + str(locations)
        slots["Location"] = None
        response = {
            "dialogAction": {
                "type": "ElicitSlot",
                "message": {
                    "contentType": "PlainText",
                    "content": response_content
                },
                "intentName": intent_request['currentIntent']['name'],
                "slots": slots,
                "slotToElicit" : "Location",
            }
        }
        return response
    elif cuisine and cuisine not in cuisines:
        response_content = "Cuisine is not valid. Valid cuisines: " + str(cuisines)
        slots["Cuisine"] = None
        response = {
            "dialogAction": {
                "type": "ElicitSlot",
                "message": {
                    "contentType": "PlainText",
                    "content": response_content
                },
                "intentName": intent_request['currentIntent']['name'],
                "slots": slots,
                "slotToElicit" : "Cuisine",
            }
        }
        return response
    else:
        response = {
            "dialogAction": {
                "type": "Delegate",
                "slots": slots
            }
        }
        return response


""" --- Intents --- """
def dispatch(intent_request):
    """
    Called when the user specifies an intent for this bot.
    """
    #logger.debug('dispatch userId={}, intentName={}'.format(intent_request['userId'], intent_request['currentIntent']['name']))

    intent_name = intent_request['currentIntent']['name']
    # "invocationSource": "FulfillmentCodeHook or DialogCodeHook"
    invocation_source = intent_request["invocationSource"]

    # Dispatch to your bot's intent handlers
    if intent_name == 'DiningSuggestionsIntent':
        if invocation_source == "FulfillmentCodeHook":
            return dining_suggestions(intent_request)
        elif invocation_source == "DialogCodeHook":
            return validate(intent_request)

    raise Exception('Intent with name ' + intent_name + ' not supported')


""" --- Main handler --- """
def lambda_handler(event, context):
    """
    Route the incoming request based on intent.
    The JSON body of the request is provided in the event slot.
    """
    # By default, treat the user request as coming from the America/New_York time zone.
    #os.environ['TZ'] = 'America/New_York'
    #time.tzset()
    #logger.debug('event.bot.name={}'.format(event['bot']['name']))

    return dispatch(event)