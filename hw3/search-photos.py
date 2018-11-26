import json
import boto3
from botocore.vendored import requests

def lambda_handler(event, context):
    # q = "show me photos with City in them"
    q = event["q"]
    
    # Disambiguate the query using Lex
    lex = boto3.client('lex-runtime')
    lex_response = lex.post_text(
        botName='SearchPhotos',
        botAlias='Prod',
        userId="search-photos", #unstructured['id'],
        inputText=q
    )
    keywords = lex_response['message'].split(" ")
    
    # Search the keywords in ElasticSearch
    results = []
    if len(keywords) <= 2:  # We only support 2 keywords. If there are more than 2, input is not valid.
        for keyword in keywords:
            host = "https://vpc-photos-nkyltrkbx6wohrt4secyzqc37e.us-east-1.es.amazonaws.com"
            search_url = host + "/photos/_search?q=" + keyword
            response = requests.get(search_url)
            response = response.json()
            for hit in response["hits"]["hits"]:
                _source = hit["_source"]
                objectKey = _source["objectKey"]
                bucket = _source["bucket"]
                labels = _source["labels"]
                result = {"url": "https://s3.amazonaws.com/" + bucket + "/" + objectKey, "labels": labels}
                results.append(result)
        return {
            'statusCode': 200,
            'body': json.dumps({"results": results})
        }
    else:  # Something wrong inside Lex
        return {
            'statusCode': 400,
            'body': lex_response["message"]
        }

"""
response syntax:
{
  "results": [
    {
      "url": "string",
      "labels": [
        "string"
      ]
    }
  ]
}
"""