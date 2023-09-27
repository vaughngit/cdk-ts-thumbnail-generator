import { Stack, StackProps, CfnOutput, RemovalPolicy, Tags, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Runtime, Function, Code, LayerVersion, IFunction,  } from 'aws-cdk-lib/aws-lambda';
import { ITable} from 'aws-cdk-lib/aws-dynamodb';
//import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { Effect, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogLevel, NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EventType, IBucket } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination  } from 'aws-cdk-lib/aws-s3-notifications';



export interface IStackProps extends StackProps{
  imageTable: ITable;
  uploadBucket: IBucket
  thumbnailBucket: IBucket; 
  environment: string; 
  costcenter: string; 
  solutionName: string; 
}

export class ThumbnailApiStack extends Construct {


  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const { region, account }  = Stack.of(this)

    const CreateThumbnailFunctionRole = new Role(this, `CreateThumbnail-LambdaRole`, {
      roleName: `${props.solutionName}-create-thumbnail-${props.environment}`,
      description: "Creates Thumbnail from image updated to s3 bucket",
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ],
      inlinePolicies: {
        LambdaInlinePolicy: new PolicyDocument({
          assignSids:true,
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [
                props.imageTable.tableArn, 
                props.uploadBucket.bucketArn,
                `${props.uploadBucket.bucketArn}/*`,
                props.thumbnailBucket.bucketArn,
                `${props.thumbnailBucket.bucketArn}/*`
              ],
              actions: [
                "s3:GetObject",
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:ListBucket"
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [
                "arn:aws:logs:*:*:*"
              ],
              actions: [
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:CreateLogStream"
              ],
            }),
          ],
        })
      }
    });


    const sharpLambdaLayer = LayerVersion.fromLayerVersionAttributes(this, "sharp lambda layer", {
      layerVersionArn: `arn:aws:lambda:${region}:${account}:layer:sharp:1`
    })

      const createThumbnailLambda = new NodejsFunction(this, 'create thumbnail lambda', {
        functionName: `${props.solutionName}-create-thumbnail-${props.environment}`,
        runtime: Runtime.NODEJS_14_X,
        memorySize: 1024,
       // memorySize: 2048,
        //timeout: Duration.seconds(60),
        timeout: Duration.minutes(3),
        handler: 'handler',
        role: CreateThumbnailFunctionRole, 
        entry: path.join(__dirname, '../lambda-functions/CreateThumbnail/index.ts' ),
        depsLockFilePath: path.join(__dirname, '../lambda-functions/CreateThumbnail/package-lock.json'),
        environment: {
          ENV: props.environment,
          tableName: props.imageTable.tableName, 
          thumbnailBucket: props.thumbnailBucket.bucketName,
          aws_region: region, 
          NODE_OPTIONS: '--enable-source-maps',
        },
        layers: [sharpLambdaLayer],
        bundling: {
          externalModules: ['aws-sdk', 'aws-lambda', "sharp"],
          nodeModules: [
            '@aws-sdk/client-s3', 
            "@aws-sdk/client-dynamodb",
            "@aws-sdk/lib-dynamodb",
            "uuid",
            "@smithy/url-parser",
            "@aws-sdk/s3-request-presigner"
          ],
          target: 'es2020', 
          keepNames: true,
          logLevel: LogLevel.INFO,
          //minify: true, // minify code, defaults to false
          sourceMap: true, // include source map, defaults to false
          sourceMapMode: SourceMapMode.INLINE, // defaults to SourceMapMode.DEFAULT
          sourcesContent: false, // do not include original source into source map, defaults to true
        }
      }); 
      
      createThumbnailLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

      props.imageTable.grantReadWriteData(createThumbnailLambda)
      
      props.uploadBucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(createThumbnailLambda))

    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)

  }
}