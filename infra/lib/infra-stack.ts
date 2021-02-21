import { Repository } from '@aws-cdk/aws-codecommit';
import { LogGroup, RetentionDays } from "@aws-cdk/aws-logs";
import { Pipeline, Artifact } from '@aws-cdk/aws-codepipeline';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import { ApplicationLoadBalancer, ApplicationTargetGroup, TargetType, ListenerCondition, ListenerAction, ApplicationProtocol, HealthCheck } from '@aws-cdk/aws-elasticloadbalancingv2';
import { Construct, RemovalPolicy, Stack, StackProps, Fn } from '@aws-cdk/core';

import { EcsService, DummyTaskDefinition, EcsDeploymentGroup, PushImageProject } from '@cloudcomponents/cdk-blue-green-container-deployment';
import { ImageRepository } from '@cloudcomponents/cdk-container-registry';

const repoName: string = (process.env.ECR_REPO_NAME as string);
const serviceName = 'spring-boot-cloud-deployment-learning';

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    var imageTag = process.env.IMAGE_TAG as string

    // Configure log group for short retention
    const logGroup = new LogGroup(this, 'LogGroup', {
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY

    });

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'ingress',
        subnetType: ec2.SubnetType.PUBLIC,
      },{
        cidrMask: 24,
        name: 'application',
        subnetType: ec2.SubnetType.PRIVATE,
      }]
    });

  console.log(vpc);

  const pubsubnets = vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC });

  console.log(pubsubnets);

  // ECR repository
  const ecrRepository = Repository.fromRepositoryName(this, 'appEcr', repoName);

  const cluster = new ecs.Cluster(this, 'Cluster', {
    vpc,
    clusterName: 'blue-green-cluster',
  });

  const loadBalancer = new ApplicationLoadBalancer(this, 'LoadBalancer', {
    vpc,
    internetFacing: true,
  });

  const defaultAction = ListenerAction.fixedResponse(400, {
    contentType: 'application/json',
    messageBody: '{"status":400}'
  });

  const prodListener = loadBalancer.addListener('ProfListener', {
    port: 8080,
    protocol: ApplicationProtocol.HTTP,
    defaultAction: defaultAction
  });

  const testListener = loadBalancer.addListener('TestListener', {
    port: 8081,
    protocol: ApplicationProtocol.HTTP,
    defaultAction: defaultAction
  });

  // // const health_check = new HealthCheck(healthy_http_codes="200-299", healthy_threshold_count=3,
  //                                       //  interval=core.Duration.seconds(70),
  //                                       //  path=health_check_path,
  //                                       //  timeout=core.Duration.seconds(60))

  const prodTargetGroup = new ApplicationTargetGroup(
    this,
    'ProdTargetGroup',
    {
      port: 8080,
      targetType: TargetType.IP,
      vpc,
    },
  );

  prodTargetGroup.configureHealthCheck({
    healthyHttpCodes: '200-299',
    healthyThresholdCount: 3,
    path: '/actuator/health',
    port: '8080'
  })

  prodListener.addTargetGroups('AddProdTg', {
    targetGroups: [prodTargetGroup],
    conditions: [
      ListenerCondition.pathPatterns([
        '/'
      ])
    ],
    priority: 1,
  });

  const testTargetGroup = new ApplicationTargetGroup(
    this,
    'TestTargetGroup',
    {
      port: 8080,
      targetType: TargetType.IP,
      vpc,
    },
  );

  testTargetGroup.configureHealthCheck({
    healthyHttpCodes: '200-299',
    healthyThresholdCount: 3,
    path: '/actuator/health',
    port: '8080'
  })  

  testListener.addTargetGroups('AddTestTg', {
    targetGroups: [testTargetGroup],
    conditions: [
      ListenerCondition.pathPatterns([
        '/'
      ])
    ],
    priority: 1,    
  });

  const image = `${ecrRepository}:${imageTag}`;

  // Will be replaced by CodeDeploy in CodePipeline
  const taskDefinition = new DummyTaskDefinition(this,
    'DummyTaskDefinition',
    {
      image: image,
      family: 'blue-green',
      containerPort: 8080
    },
  );

  const ecsService = new EcsService(this, 'EcsService', {
    cluster,
    serviceName: 'blue-green-service',
    desiredCount: 2,
    taskDefinition,
    prodTargetGroup,
  });

  // ssm.StringParameter(self, "ParameterEcsRoleArn",
  // string_value=ecs_service_role.role_arn,
  // parameter_name=f"{service_name}-ecs-role",
  // description=f"SSM Parameter for the role arn of {service_name}")

  // ecsService.connections.allowFrom(loadBalancer, ec2.Port.tcp(8080));
  ecsService.connections.allowFrom(loadBalancer, ec2.Port.tcp(8080));

  const deploymentGroup = new EcsDeploymentGroup(this, 'DeploymentGroup', {
    applicationName: 'blue-green-application',
    deploymentGroupName: 'blue-green-deployment-group',
    ecsServices: [ecsService],
    targetGroupNames: [
      prodTargetGroup.targetGroupName,
      testTargetGroup.targetGroupName,
    ],
    prodTrafficListener: prodListener,
    testTrafficListener: testListener,
    terminationWaitTimeInMinutes: 10,
  });

  const containerTaskRole = new iam.Role(this, 'SpringCloudAppRole', {
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
  })
  containerTaskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'))
  containerTaskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess'))

  // const task_definition = {
  //           "executionRoleArn": "ROLE_ARN",
  //           "containerDefinitions": [
  //               {
  //                   "name": serviceName,
  //                   "image": "<IMAGE_NAME>",
  //                   "essential": true,
  //                   "portMappings": [
  //                       {
  //                           "hostPort": 8080,
  //                           "protocol": "tcp",
  //                           "containerPort": 8080
  //                       }
  //                   ],
  //                   "logConfiguration": {
  //                       "logDriver": "awslogs",
  //                       "secretOptions": [],
  //                       "options": {
  //                           "awslogs-group": serviceName,
  //                           "awslogs-region": props?.env?.region,
  //                           "awslogs-stream-prefix": "ecs"
  //                       }
  //                   }
  //               }
  //           ],
  //           "requiresCompatibilities": ["FARGATE"],
  //           "networkMode": "awsvpc",
  //           "cpu": "256",
  //           "memory": "512",
  //           "taskRoleArn": "ROLE_ARN",
  //           "family": serviceName
  //       }

  // var fargateService = new ecspatterns.ApplicationLoadBalancedFargateService(this, 'myLbFargateService', {
  //   vpc: vpc,
  //   memoryLimitMiB: 512,
  //   cpu: 256,
  //   assignPublicIp: true,
  //   // listenerPort: 8080,  
  //   taskImageOptions: {
  //     containerName: repoName,
  //     image: ecs.ContainerImage.fromEcrRepository(ecrRepository, imageTag),
  //     containerPort: 8080,
  //   },
  // });

  // fargateService.targetGroup.configureHealthCheck({
  //   port: '8080',
  //   path: '/actuator/health',
  // });

}
}
