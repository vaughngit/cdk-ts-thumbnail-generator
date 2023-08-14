-[Tutorial: Using an Amazon S3 trigger to create thumbnail images](https://docs.aws.amazon.com/lambda/latest/dg/with-s3-tutorial.html#with-s3-tutorial-dummy-test)

-[S3 Bucket Notifications Destinations](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_notifications-readme.html)

-[Something went wrong installing the \"sharp\" on aws Lambda](https://stackoverflow.com/questions/70487565/something-went-wrong-installing-the-sharp-on-aws-lambda)


`
I would recommend using a layer, much easier to configure and deploy. On the AWS console, you can deploy this layer - https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/create/app?applicationId=arn:aws:serverlessrepo:us-east-1:987481058235:applications/nodejs-sharp-lambda-layer

If that URL doesn't work, navigate to functions on the console -> Create Function -> Browse Serveless App Repo -> Search for "Sharp", select "nodejs-sharp-lambda-layer".

Deploy the layer -> On your lambda function, select the layer.
`

https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/create/app?applicationId=arn:aws:serverlessrepo:us-east-2:987481058235:applications/nodejs-sharp-lambda-layer

- [API Gateway REST API to S3 ](https://serverlessland.com/patterns/apigw-s3)
-[REST API as an Amazon S3 proxy in API Gateway](https://github.com/aws-samples/serverless-patterns/blob/main/apigw-s3-cdk/README.md)



More examples: https://docs.aws.amazon.com/AmazonS3/latest/userguide/example_s3_Scenario_PresignedUrl_section.html 