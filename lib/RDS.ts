import 'source-map-support'
import { Construct } from 'constructs'
import { Stack, StackProps, RemovalPolicy, SecretValue } from 'aws-cdk-lib'
import { DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion, SubnetGroup } from 'aws-cdk-lib/aws-rds'
import { InstanceClass, InstanceSize, InstanceType, Vpc, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2'

interface RDSStackProps extends StackProps {
  vpc: Vpc
}

export class RDSStack extends Stack {
  public readonly endpoint: string
  constructor(scope: Construct, id: string, props: RDSStackProps) {
    const vpc = props.vpc
    super(scope, id)

    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      securityGroupName: 'restore-rds-sg',
      vpc: vpc
    })
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.MYSQL_AURORA)

    const subnetGroup = new SubnetGroup(this, 'SubnetGroup', {
      description: 'test',
      vpc: vpc,
      vpcSubnets: {
        availabilityZones: [`${this.region}a`, `${this.region}c`]
      },
      removalPolicy: RemovalPolicy.DESTROY
    })

    const databaseInstance = new DatabaseInstance(this, 'DatabaseInstance', {
      engine: DatabaseInstanceEngine.mysql({ version: MysqlEngineVersion.VER_8_0_39}),
      instanceIdentifier: 'restore-rds',
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      vpc: vpc,
      subnetGroup: subnetGroup,
      removalPolicy: RemovalPolicy.DESTROY,
      deleteAutomatedBackups: false,
      credentials: {
        username: 'admin',
        password: SecretValue.ssmSecure('/rds/aurora/mysql/password')
      },
      securityGroups: [securityGroup]
    })

    this.endpoint = databaseInstance.dbInstanceEndpointAddress
  }
}