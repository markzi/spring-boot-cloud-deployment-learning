import { Repository } from '@aws-cdk/aws-codecommit';
import { LogGroup, RetentionDays } from "@aws-cdk/aws-logs";
import { Pipeline, Artifact } from '@aws-cdk/aws-codepipeline';
import { Vpc, Port } from '@aws-cdk/aws-ec2';
import { Cluster } from '@aws-cdk/aws-ecs';
import { ApplicationLoadBalancer, ApplicationTargetGroup, TargetType } from '@aws-cdk/aws-elasticloadbalancingv2';
import { Construct, Stack, StackProps } from '@aws-cdk/core';

import { EcsService, DummyTaskDefinition, EcsDeploymentGroup, PushImageProject } from '@cloudcomponents/cdk-blue-green-container-deployment';
import { ImageRepository } from '@cloudcomponents/cdk-container-registry';

const repoName: string = (process.env.ECR_REPO_NAME as string);

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    var imageTag = process.env.IMAGE_TAG as string

    // Configure log group for short retention
    const logGroup = new LogGroup(this, 'LogGroup', {
      retention: RetentionDays.ONE_WEEK,
    });

    // Retrieve default VPC information
    var vpc = Vpc.fromLookup(this, "VPC", {
      isDefault: true
    })

    // ECR repository
    const ecrRepository = Repository.fromRepositoryName(this, 'appEcr', repoName);

    const cluster = new Cluster(this, 'Cluster', {
      vpc,
      clusterName: 'blue-green-cluster',
    });

    const loadBalancer = new ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc,
      internetFacing: true,
    });

    const prodListener = loadBalancer.addListener('ProfListener', {
      port: 80,
    });

    const testListener = loadBalancer.addListener('TestListener', {
      port: 8080,
    });

    const prodTargetGroup = new ApplicationTargetGroup(
      this,
      'ProdTargetGroup',
      {
        port: 80,
        targetType: TargetType.IP,
        vpc,
      },
    );

    prodListener.addTargetGroups('AddProdTg', {
      targetGroups: [prodTargetGroup],
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

    testListener.addTargetGroups('AddTestTg', {
      targetGroups: [testTargetGroup],
    });

    // Will be replaced by CodeDeploy in CodePipeline
    const taskDefinition = new DummyTaskDefinition(this,
      'DummyTaskDefinition',
      {
        image: 'nginx',
        family: 'blue-green',
      },
    );

    const ecsService = new EcsService(this, 'EcsService', {
      cluster,
      serviceName: 'blue-green-service',
      desiredCount: 2,
      taskDefinition,
      prodTargetGroup,
    });

    ecsService.connections.allowFrom(loadBalancer, Port.tcp(8080));
    ecsService.connections.allowFrom(loadBalancer, Port.tcp(8080));

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
      terminationWaitTimeInMinutes: 100,
    });

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
