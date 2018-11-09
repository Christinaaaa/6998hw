import json
import boto3
from botocore.vendored import requests
from urllib.parse import urlencode

def lambda_handler(event, context):
    # TODO implement

    # Create SQS client
    sqs = boto3.client('sqs')
    queue_url = 'https://sqs.us-east-1.amazonaws.com/496832576384/DiningConciergeQueue'
    
    # Receive message from SQS queue
    response = sqs.receive_message(
        QueueUrl=queue_url,
        AttributeNames=[
            'SentTimestamp'
        ],
        MaxNumberOfMessages=1,
        MessageAttributeNames=[
            'All'
        ],
        VisibilityTimeout=0,
        WaitTimeSeconds=0
    )
    # Check if there are outstanding messages. If yes, parse the message
    if not 'Messages' in response.keys():
        return {'Processed and deleted message: ' : None}
    message = response['Messages'][0]
    receipt_handle = message['ReceiptHandle']
    message_id = message['MessageId']
    body = json.loads(message['Body'])
    
    cuisine = body['Cuisine']
    number_of_people = body['NumberOfPeople']
    phone_number = body['PhoneNumber']
    dining_time = body['DiningTime']
    location = body['Location']
    
    # Initiate request to Google Places Text Search API
    key = "AIzaSyAQkD44xBWVPQpENekU8hCGd93c8UprYZ0"
    query = cuisine + " restaurant in " + location
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json?" + urlencode({"key": key, "query": query})
    res = requests.get(url).json()
    restaurants = []
    for restaurant in res['results']:
        restaurants.append({"name": restaurant['name'], "address": restaurant["formatted_address"]})
    
    # Put into DynamoDB
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('DiningConciergeQuery')
    response = table.put_item(
        Item={
            'MessageID': message_id,
            'Cuisine': cuisine,
            "NumberOfPeople": number_of_people,
            "PhoneNumber": phone_number,
            "DiningTime": dining_time,
            'location': location,
            'data': restaurants
        }
    )
    
    # Send to SNS
    msg = 'Restaurant name: ' + restaurants[0]['name'] +'; Address: ' + restaurants[0]['address']
    client = boto3.client('sns')
    response = client.publish(
        PhoneNumber='+1' + phone_number,
        Message=msg
    )
    
    #Delete received message from queue
    sqs.delete_message(
        QueueUrl=queue_url,
        ReceiptHandle=receipt_handle
    )
    
    return {'Sent SNS ': response}
