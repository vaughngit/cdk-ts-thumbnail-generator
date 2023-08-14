import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { S3StorageConstruct } from './constructs/s3-storage-construct';
import {ThumbnailApiStack} from './constructs/ThumbnailApiStack'
import { DynamoDBConstruct } from './constructs/dynamodb-construct';
import {ApigwyConstruct} from './constructs/api-gateway-construct'

export interface IStackProps extends cdk.StackProps{
  environment: string; 
  costcenter: string; 
  solutionName: string; 
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id, props);


    const {uploadBucket, thumbnailBucket} = new S3StorageConstruct(this, "s3 storage", {...props})
    const {imageTable} = new DynamoDBConstruct(this, "image ref table",{...props} )
    new ThumbnailApiStack(this, "create thumbnail lambda",{uploadBucket, thumbnailBucket, imageTable, ...props} )
    //new ApigwyConstruct(this, "api gateway proxy", props)

  }
}
