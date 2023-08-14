# Image Resizer CDK TypeScript project

- Deploy the CDK Project via cdk deploy 
- Within the AWS S3 Console Upload an jpg or png image to the with the world "upload" in the name
- Review the resized image in the bucket with the word "thumbnails" in the same
- Review the image info in dynamodb with created by this project 

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


