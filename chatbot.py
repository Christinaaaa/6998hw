import json
import time

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
        if unstructured["text"] == "Hello":
            response_text = "Hi there, how can I help?"
        else:
            response_text = "I'm not sure I understand."
        response_unstructured = {"id": unstructured["id"], "text": response_text, "timestamp": str(int(time.time() * 1000))}
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
