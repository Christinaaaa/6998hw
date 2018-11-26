import json
import boto3
# from botocore.vendored import elasticsearch  # Need to upload zip
# from botocore.vendored import requests_aws4auth  # Need to upload zip, only needed for signing
from botocore.vendored import requests

def lambda_handler(event, context):
    # Rekognition resource
    rekognition = boto3.client('rekognition')
    
    # Get fileName and bucket from event
    fileName=event["Records"][0]["s3"]["object"]["key"]
    bucket=event["Records"][0]["s3"]["bucket"]["name"]
    # use rekognition detect labels
    response = rekognition.detect_labels(Image={'S3Object':{'Bucket':bucket,'Name':fileName}}, MaxLabels=10, MinConfidence=70)
    # print(response)
    # print('Detected labels for ' + fileName)
    
    # construct the index to store to elastic search
    labels = []
    for label in response['Labels']:
        # print (label['Name'] + ' : ' + str(label['Confidence']))
        labels.append(label['Name'])
    index = {"objectKey": fileName, "bucket": bucket, "createdTimestamp": event["Records"][0]["eventTime"], "labels": labels}
    
    # Now, store to ElasticSearch
    host = "https://vpc-photos-nkyltrkbx6wohrt4secyzqc37e.us-east-1.es.amazonaws.com"
    post_url = host + "/photos/_doc"
    response = requests.post(post_url, json=index)
    response = response.text
    
    # Search for something: only for test purposes
    # q = "Urban"
    # search_url = host + "/photos/_search?q=" + q
    # response = requests.get(search_url)
    # response = response.text
    
    # Delete all, useful when you uploaded some garbage
    # delete_q = {"query" : {"match_all" : {}}}
    # delete_url =  host + "/photos/_doc/_delete_by_query"
    # response = requests.post(delete_url, json=delete_q)
    # response = response.text
    
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }

"""
Event schema:
{
    "Records": [
        {
            "eventVersion": "2.0",
            "eventSource": "aws:s3",
            "awsRegion": "us-east-1",
            "eventTime": "2018-11-21T17:35:16.216Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "A3PT2F35IR80HE"
            },
            "requestParameters":{
                "sourceIPAddress": "160.39.134.78"
                
            },
            "responseElements": {
                "x-amz-request-id": "EF5DCAF6EA76144E",
                "x-amz-id-2": "gsBUoWx+CwKQqSPsSmi3WeJ7C+sWgONM8srQmAZWPUnG2UF+Y9qD3ay/voFLi/azPrjARNkSQeo="
            },
            "s3": {
                "s3SchemaVersion": "1.0",
                "configurationId": "PhotosPutEvent",
                "bucket": {
                    "name": "6998photos",
                    "ownerIdentity": {
                        "principalId": "A3PT2F35IR80HE"
                    },
                    "arn": "arn:aws:s3:::6998photos"
                },
                "object": {
                    "key": "IMG_8702.JPG",
                    "size": 3141468,
                    "eTag": "65717d4f05e4c820cc32496ff6d2ddfe",
                    "versionId": "gYz4oAM0hTJmAqCfHCfa5s5IjeYJ8NAr",
                    "sequencer": "005BF597541C0249FC"
                }
            }
        }
    ]
}
"""