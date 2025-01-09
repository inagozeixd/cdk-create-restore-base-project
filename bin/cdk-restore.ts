import 'source-map-support'
import { App } from 'aws-cdk-lib'
import { VPCStack } from '../lib/VPC'
import { EFSStack } from '../lib/EFS'
import { RDSStack } from '../lib/RDS'
import { S3Stack } from '../lib/S3'
import { EC2Stack } from '../lib/EC2'

const app = new App()

const s3Stack = new S3Stack(app, 'S3Stack')
const vpcStack = new VPCStack(app, 'VPCStack')
const efsStack = new EFSStack(app, 'EFSStack', {
  vpc: vpcStack.vpc
})
const rdsStack = new RDSStack(app, 'RDSStack', {
  vpc: vpcStack.vpc
})
const ec2Stack = new EC2Stack(app, 'EC2Stack', {
  vpc: vpcStack.vpc,
  bucketArn: s3Stack.bucketArn,
  bucketName: s3Stack.bucketName,
  endpoint: rdsStack.endpoint,
  fileSystemId: efsStack.fileSystemId
})