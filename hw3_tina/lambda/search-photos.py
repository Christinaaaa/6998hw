import math
import dateutil.parser
import datetime
import time
import os
import logging
import boto3
import requests
import json
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)


""" --- Helpers to build responses which match the structure of the necessary dialog actions --- """


def get_slots(intent_request):
    return intent_request['currentIntent']['slots']


def close(session_attributes, fulfillment_state, message):
    response = {
        'sessionAttributes': session_attributes,
        'dialogAction': {
            'type': 'Close',
            'fulfillmentState': fulfillment_state,
            'message': message
        }
    }

    return response

""" --- Functions that control the bot's behavior --- """
def photo_search(keywords):
    """
    Performs dialog management and fulfillment for ordering flowers.
    Beyond fulfillment, the implementation of this intent demonstrates the use of the elicitSlot dialog action
    in slot validation and re-prompting.
    """
    arr = []
    url = "https://vpc-photos-32vlvhi2qvzk7hjaag2ipseee4.us-east-1.es.amazonaws.com"
    for k, v in keywords.items():
        if v != None:
            search_url = url + "/photos/_search?q=" + v
            response = requests.get(search_url)
            arr.append(response.text)
            

    # Order the flowers, and rely on the goodbye message of the bot to define the message to the end user.
    # In a real bot, this would likely involve a call to a backend service.
    return arr


""" --- Main handler --- """


def lambda_handler(event, context):
    """
    Route the incoming request based on intent.
    The JSON body of the request is provided in the event slot.
    """
    
    q = event["q"]
    client = boto3.client('lex-runtime')

    response = client.post_text(
        botName='PhotoSearch',
        botAlias='photo',
        userId="user_id",
        inputText=q
    )
    #print ("response:",response)
    if 'slots' not in response:
        return response['message']
    keywords = response['slots']
    
    #print ("keywords:",keywords)
    arr = photo_search(keywords)
    #print (arr)
    res = {
            "results": []
        }

    tmp = []
    for i in range(len(arr)):
        d = json.loads(arr[i])
        print (d["hits"]["hits"])
        
        for r in d["hits"]["hits"]:
            img = {
                "url": "string",
                "labels": ["string"]
            }
            fileName = r["_source"]["objectKey"]
            labels = r["_source"]["labels"]
            img["url"] = "https://s3.amazonaws.com/photob2/" + fileName
            img["labels"] = labels
            tmp.append(img)
    res["results"] = tmp
    print (res["results"])
    return res
    #return response['message']
    #return photo_search(response)
