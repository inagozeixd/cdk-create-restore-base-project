import { Construct } from 'constructs'
import { Stack, StackProps, Tags } from 'aws-cdk-lib'
import { Vpc, IpAddresses, SubnetType } from 'aws-cdk-lib/aws-ec2';

export class VPCStack extends Stack {

  public readonly vpc: Vpc

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, 'VPC', {
      vpcName: `cdk-restore-vpc`,
      ipAddresses: IpAddresses.cidr('10.20.0.0/16'),
      availabilityZones: [`${this.region}a`, `${this.region}c`],
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public-subnet',
          cidrMask: 24,
          subnetType: SubnetType.PUBLIC
        },
        {
          name: 'private-subnet',
          cidrMask: 24,
          subnetType: SubnetType.PRIVATE_WITH_EGRESS
        }
      ]
    })

    this.vpc.publicSubnets.forEach(subnet => {
      Tags.of(subnet).add('Name', `public-subnet-${subnet.availabilityZone}`)
    })

    this.vpc.privateSubnets.forEach(subnet => {
      Tags.of(subnet).add('Name', `private-subnet-${subnet.availabilityZone}`)
    })
    
  }
}