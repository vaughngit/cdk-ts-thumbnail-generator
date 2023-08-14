import { Stack, StackProps, Tags, CfnOutput, Duration, CustomResource, RemovalPolicy } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';


interface IStackProps extends StackProps {
  environment: string; 
  solutionName: string; 
  costcenter: string; 
};

export class S3StorageConstruct extends Construct {

  public readonly uploadBucket: IBucket; 
  public readonly thumbnailBucket: IBucket; 

  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const { region, account }  = Stack.of(this)
    
      const uploadBucket = new Bucket(this, "uploadBucket", {
       bucketName: `${props.solutionName.toLocaleLowerCase()}-upload-${props.environment.toLocaleLowerCase()}-${account}`, 
        cors: [
          {
            allowedHeaders: ['*'],
            allowedMethods: [
              s3.HttpMethods.GET,
              s3.HttpMethods.POST,
              s3.HttpMethods.PUT,
              s3.HttpMethods.HEAD,
              s3.HttpMethods.DELETE,
              s3.HttpMethods.POST
            ],
            allowedOrigins: ['*'],
            exposedHeaders: [
              "x-amz-server-side-encryption",
              "x-amz-request-id",
              "x-amz-id-2",
              "ETag"
            ],
            maxAge: 3000
          },
        ],
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true
      });

      const thumbnailBucket = new Bucket(this, "ThumbnailBucket", {
        bucketName: `${props.solutionName.toLocaleLowerCase()}-thumbnails-${props.environment.toLocaleLowerCase()}-${account}`,
         cors: [
           {
             allowedHeaders: ['*'],
             allowedMethods: [
               s3.HttpMethods.GET,
               s3.HttpMethods.POST,
               s3.HttpMethods.PUT,
               s3.HttpMethods.HEAD,
               s3.HttpMethods.DELETE,
               s3.HttpMethods.POST
             ],
             allowedOrigins: ['*'],
             exposedHeaders: [
               "x-amz-server-side-encryption",
               "x-amz-request-id",
               "x-amz-id-2",
               "ETag"
             ],
             maxAge: 3000
           },
         ],
         removalPolicy: RemovalPolicy.DESTROY,
         autoDeleteObjects: true
       });

   
      this.uploadBucket = uploadBucket
      this.thumbnailBucket = thumbnailBucket

    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)

   // new CfnOutput(this, 'bucketArn', {value: storageBucket.bucketArn})

  }
}
