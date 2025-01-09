import 'source-map-support'
import { Construct } from 'constructs'
import { Stack, StackProps, RemovalPolicy, Fn } from 'aws-cdk-lib'
import { Bucket } from 'aws-cdk-lib/aws-s3'

export class S3Stack extends Stack {
  public readonly bucketArn: string
  public readonly bucketName: string
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id)

    const bucket = new Bucket(this, 'Bucket', {
      bucketName: 'restore-bucket-' + Fn.select(4, Fn.split('-', Fn.select(2, Fn.split('/', this.stackId)))),
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true
    })

    this.bucketArn = bucket.bucketArn
    this.bucketName = bucket.bucketName
  }
}