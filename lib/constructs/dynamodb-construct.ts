
import { Stack, StackProps, SecretValue, Tags, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as path from 'path';
import { AttributeType, BillingMode, Table, ITable } from 'aws-cdk-lib/aws-dynamodb';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';



export interface IStackProps extends StackProps{
  environment: string; 
  costcenter: string; 
  solutionName: string;
}

export class DynamoDBConstruct extends Construct {
  public readonly imageTable: ITable;

  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const tableName: string = `${props.solutionName.toLocaleLowerCase()}-image-table-${props.environment.toLocaleLowerCase()}`
    //change this to data table: 
    const imageTable = new Table(this, 'dataTable', {
      tableName: tableName,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      partitionKey: { 
        name: 'id', 
        type: AttributeType.STRING 
      },
    })
    this.imageTable = imageTable

    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)


  }
}
