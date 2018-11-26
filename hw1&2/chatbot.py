import json
import time
import boto3

def lambda_handler(event, context):
    # TODO implement
    '''
    Schema of request / response:
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
    '''
    try:
        message = event["messages"][0]
        unstructured = message["unstructured"]
        
        client = boto3.client('lex-runtime')

        lex_response = client.post_text(
            botName='DiningConcierge',
            botAlias='Prod',
            userId=unstructured['id'],
            inputText=unstructured['text']
        )
        
        response_unstructured = {"id": unstructured["id"], "text": lex_response['message'], "timestamp": str(int(time.time() * 1000))}
        response_message = {"type": "string", "unstructured": response_unstructured}
        response = {"messages": []}
        response["messages"].append(response_message)
        return {
            "statusCode": 200,
            "body": json.dumps(response)
        }
    except Exception as e:
        return {
            "statusCode": 501,
            "body": json.dumps({"Error": str(e)})
        }
