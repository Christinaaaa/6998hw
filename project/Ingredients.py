import json
import boto3
from botocore.vendored import requests
from urllib.parse import urlencode

def lambda_handler(event, context):
    if "ingredients" in event.keys():  # Pass in ingredients
        ingredients = event["ingredients"]
    else:  # Default ingredients. For scheduled execution?
        ingredients = {  # Try not to do all these in one go, as it may timeout.
            "Protein": ["Chicken", "Beef", "Pork", "Lamb"],
            "Rice": ["Brown Rice", "White Rice"],
            "Vegetables": ["Cabbage", "Spinach", "Kale"]
        }
    
    # Initiate request to Edamam Food database API
    app_id = "bf4ff7fa"
    app_key = "da853382cc6d68d0b41251dc798835db"
    url = "https://api.edamam.com/api/food-database/parser?" + urlencode({"app_id": app_id, "app_key": app_key, "nutrition-type": "logging"})
    
    # Put into DynamoDB
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Ingredients')
    
    for category in ingredients:
        for ingredient in ingredients[category]:
            r = requests.get(url + "&" + urlencode({"ingr": ingredient}))
            if r.status_code != 200:
                return {
                    'statusCode': r.status_code,
                    'body': r.text
                }
            else:
                result = r.json()
                item = {"name": ingredient, "category": category}
                item["label"] = result["parsed"][0]["food"]["label"]
                item["quantity"] = str(result["parsed"][0]["quantity"])  # DynamoDB only supports strings and integers
                item["measure"] = result["parsed"][0]["measure"]["label"]
                item["nutrients"] = {k: str(v) for k, v in result["parsed"][0]["food"]["nutrients"].items()}  # DynamoDB only supports strings and integers
                
                # Put into DynamoDB
                response = table.put_item(Item=item)
    
    return {
        'statusCode': r.status_code,
        'body': response
    }
