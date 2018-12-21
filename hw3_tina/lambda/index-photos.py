import json
import urllib
import boto3
import requests

def helper(event):
    # Rekognition resource
    rekognition = boto3.client('rekognition')
    
    # Get fileName and bucket from event
    fileName=event["Records"][0]["s3"]["object"]["key"]
    bucket=event["Records"][0]["s3"]["bucket"]["name"]
    eventTime = event["Records"][0]["eventTime"]
    print (fileName,bucket,eventTime)
    
    # use rekognition detect labels
    response = rekognition.detect_labels(Image={'S3Object':{'Bucket':bucket,'Name':fileName}}, MaxLabels=10, MinConfidence=70)
    
    # construct the index to store to elastic search
    labels = []
    for label in response['Labels']:
        labels.append(label['Name'])
    
    img = {
                    "objectKey": fileName,
                    "bucket": bucket,
                    "createdTimestamp": eventTime,
                    "labels": labels
    }
    
    return img
        
    '''
    es = Elasticsearch()
    
    img = {
                    "objectKey": fileName,
                    "bucket": bucket,
                    "createdTimestamp": eventTime,
                    "labels": labels
    }
    print ("in")
    res = es.index(index="photos", doc_type='images', body = img)
    print(res)
    
    return res
    '''
def lambda_handler(event, context):
    img = helper(event)
    print (img)
    #put img into ES
    url = 'https://vpc-photos-32vlvhi2qvzk7hjaag2ipseee4.us-east-1.es.amazonaws.com'
    post_url = url+'/photos/_doc'
    r = requests.post(post_url, json=img)
    print (r.text)
    
    # Delete all, only for test purposes
    # delete_q = {"query" : {"match_all" : {}}}
    # delete_url =  url + "/photos/_doc/_delete_by_query"
    # response = requests.post(delete_url, json=delete_q)
    # print (response.text)
    
    # Search for something: only for test purposes
    q = "flower"
    search_url = url + "/photos/_search?q=" + q
    response = requests.get(search_url)
    print (response.text)
    
    return response.text
    # return {
    #     'statusCode': 200,
    #     'body': json.dumps(response)
    # }
    