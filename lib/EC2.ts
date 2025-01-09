import 'source-map-support'
import { Construct } from 'constructs'
import { Stack, StackProps } from 'aws-cdk-lib'
import { Instance, InstanceType, InstanceClass, InstanceSize, Vpc, UserData, MachineImage, SubnetType, SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import { Role, Policy, PolicyStatement, Effect, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam'

interface EC2StackProps extends StackProps {
  vpc: Vpc
  bucketArn: string
  bucketName: string
  endpoint: string
  fileSystemId: string
}

export class EC2Stack extends Stack {

  constructor(scope: Construct, id: string, props: EC2StackProps) {
    super(scope, id)

    const vpc = props.vpc
    const bucketArn = props.bucketArn
    const bucketName = props.bucketName
    const endpoint = props.endpoint
    const fileSystemId = props.fileSystemId

    const createTableCommands: Array<string> = [
      'CREATE TABLE IF NOT EXISTS books (',
      'book_id INT AUTO_INCREMENT PRIMARY KEY,',
      'title VARCHAR(200) NOT NULL,',
      'author VARCHAR(100) NOT NULL,',
      'genre VARCHAR(50),',
      'published_year YEAR,',
      'price DECIMAL(8,2),',
      'stock INT DEFAULT 0,',
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      ') ENGINE=InnoDB'
    ]
    const insertIntoCommands: Array<string> = [
      'INSERT INTO books (title, author, genre, published_year, price, stock) VALUES ',
      `('吾輩は猫である', '夏目 漱石', '小説', 1905, 500.00, 30),`,
      `('走れメロス', '太宰 治', '短編小説', 1940, 300.00, 50),`,
      `('1Q84', '村上 春樹', '小説', 2009, 1500.00, 20),`,
      `('銀河鉄道の夜', '宮沢 賢治', 'ファンタジー', 1934, 400.00, 40),`,
      `('ノルウェイの森', '村上 春樹', '小説', 1987, 1200.00, 25),`,
      `('コンビニ人間', '村田 沙耶香', '小説', 2016, 800.00, 35),`,
      `('沈黙', '遠藤 周作', '歴史小説', 1966, 1000.00, 15),`,
      `('告白', '湊 かなえ', 'ミステリー', 2008, 700.00, 45),`,
      `('図書館戦争', '有川 浩', 'ライトノベル', 2008, 600.00, 60),`,
      `('火花', '又吉 直樹', '小説', 2015, 900.00, 20)`,
    ]

    const userData = UserData.forLinux()
    userData.addCommands(
      'dnf update -y',
      'dnf install -y mariadb105',
      'DB_PASSWORD=$(aws ssm get-parameter --name /rds/aurora/mysql/password --with-decryption --query Parameter.Value --output text)',
      `mariadb -u admin -h ${endpoint} -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS library;"`,
      `mariadb -u admin -h ${endpoint} -p"$DB_PASSWORD" library -e "${createTableCommands.join('')};"`,
      `mariadb -u admin -h ${endpoint} -p"$DB_PASSWORD" library -e "${insertIntoCommands.join('')};"`,
      'dnf install -y amazon-efs-utils',
      'mkdir /home/ec2-user/efs',
      `mount -t efs -o tls ${fileSystemId}:/ /home/ec2-user/efs`,
      'cat <<EOF > /home/ec2-user/efs/efs.txt',
      'hello efs',
      'EOF',
      'cat <<EOF > /home/ec2-user/upload_s3.txt',
      'hello s3',
      'EOF',
      `aws s3 cp /home/ec2-user/s3.txt s3://${bucketName}`
    )

    // const role = Role.fromRoleName(this, 'FromRoleName', 'AmazonSSMManagedInstanceCoreRole')
    const role = new Role(this, 'RestoreEC2Role', {
      roleName: 'restore-ec2-role',
      assumedBy: new ServicePrincipal('ec2.amazonaws.com')
    })
    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))
    const policy = new Policy(this, 'S3PubObjectPolicy', {
      policyName: 'restore-ec2-policy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:PutObject'],
          resources: [`${bucketArn}/*`]
        })
      ]
    })
    policy.attachToRole(role)

    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      securityGroupName: 'restore-ec2-sg',
      vpc: vpc
    })

    const ec2 = new Instance(this, 'EC2Instance', {
      instanceName: 'restore-ec2',
      associatePublicIpAddress: true,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      machineImage: MachineImage.latestAmazonLinux2023(),
      role: role,
      vpc: vpc,
      vpcSubnets: {
        availabilityZones: [`${this.region}a`, `${this.region}c`],
        subnetType: SubnetType.PUBLIC
      },
      securityGroup: securityGroup,
      userData: userData
    })
  
  }
}