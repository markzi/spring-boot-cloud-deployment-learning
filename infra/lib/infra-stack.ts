import * as cdk from '@aws-cdk/core';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecspatterns from '@aws-cdk/aws-ecs-patterns';

const repoName: string = (process.env.ECR_REPO_NAME as string);

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    var imageTag = process.env.IMAGE_TAG as string

    // Retrieve default VPC information
    var vpc = ec2.Vpc.fromLookup(this, "VPC", {
      isDefault: true
    })

    // ECR repository
    const ecrRepository = ecr.Repository.fromRepositoryName(this, 'appEcr', repoName);

    var fargateService = new ecspatterns.ApplicationLoadBalancedFargateService(this, 'myLbFargateService', {
      vpc: vpc,
      memoryLimitMiB: 512,
      cpu: 256,
      assignPublicIp: true,
      // listenerPort: 8080,  
      taskImageOptions: {
        containerName: repoName,
        image: ecs.ContainerImage.fromEcrRepository(ecrRepository, imageTag),
        containerPort: 8080,
      },
    });

    fargateService.targetGroup.configureHealthCheck({
      port: '8080',
      path: '/actuator/health',
    });

  }
}
