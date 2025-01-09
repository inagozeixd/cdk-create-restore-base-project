import 'source-map-support'
import { Construct } from 'constructs'
import { Stack, StackProps, RemovalPolicy, Fn } from 'aws-cdk-lib'
import { FileSystem } from 'aws-cdk-lib/aws-efs'
import { Vpc, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2'

interface EFSStackProps extends StackProps {
  vpc: Vpc
}

export class EFSStack extends Stack {
  public readonly fileSystemId: string
  constructor(scope: Construct, id: string, props: EFSStackProps) {
    const vpc = props.vpc
    super(scope, id)

    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      securityGroupName: 'restore-efs-sg',
      vpc: vpc
    })
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.NFS)    
    
    const fileSystem = new FileSystem(this, 'FileSystem', {
      vpc: vpc,
      fileSystemName: 'restore-efs',
      removalPolicy: RemovalPolicy.DESTROY,
      securityGroup: securityGroup
    })

    this.fileSystemId = fileSystem.fileSystemId
  }
}