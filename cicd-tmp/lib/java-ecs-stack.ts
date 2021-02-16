import * as cdk from '@aws-cdk/core';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecspatterns from '@aws-cdk/aws-ecs-patterns';
import * as codebuild from '@aws-cdk/aws-codebuild';
import { ManagedPolicy } from '@aws-cdk/aws-iam';
import { GitHubSourceAction, CodeBuildAction, EcsDeployAction} from '@aws-cdk/aws-codepipeline-actions';
import { RemovalPolicy } from '@aws-cdk/core';

const repoName = "spring-boot-cloud-deployment-learning";
const repoBranch = "main";
const repoOwner = "markzi";

export class JavaEcsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // retrieve Github access token
    var oauthToken = cdk.SecretValue.secretsManager('github/oauth/token');

    let sourceOutput: Artifact;
    let buildOutput: Artifact;

    // Retrieve default VPC information
    var vpc = ec2.Vpc.fromLookup(this, "VPC", {
      isDefault: true
    })

    // ECR repository
    const ecrRepository = new ecr.Repository(this, repoName, {
      repositoryName: repoName,
      removalPolicy: RemovalPolicy.DESTROY
    });

    var pipelineProject = this.createPipelineProject(ecrRepository);
    pipelineProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));

    sourceOutput = new Artifact();
    buildOutput = new Artifact();

    var githubSourceAction = this.createGithubSourceAction(sourceOutput, oauthToken);
    var buildAction = this.createBuildAction(pipelineProject, sourceOutput, buildOutput);
    
    var ecsDeployAction = this.createEcsDeployAction(vpc, ecrRepository, buildOutput, pipelineProject);

    var pipeline = new Pipeline(this, 'my_pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [githubSourceAction]
        },
        {
          stageName: 'Build',
          actions: [buildAction]
        },
        {
          stageName: 'Deploy',
          actions: [ecsDeployAction]
        },
      ],
      pipelineName: 'my_pipeline',
      //artifactBucket: artifactBucket
    });
  }

  // ----------------------- some helper methods -----------------------
  /**
   * create the Pipeline Project wuth Buildspec and stuff
   */
  private createPipelineProject(ecrRepo: ecr.Repository): codebuild.PipelineProject {
    var pipelineProject = new codebuild.PipelineProject(this, 'my-codepipeline', {
      projectName: 'my-codepipeline',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true
      },
      environmentVariables: {
        "ECR_REPO": {
          value: ecrRepo.repositoryUriForTag()
        },
        "ECR_REPO_NAME": {
          value: repoName
        },
        "AWS_DEFAULT_REGION": {
          value: this.region
        },
        "AWS_ACCOUNT_ID": {
          value: this.account
        },        
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM)
    });
    return pipelineProject;
  }

  /**
   * creates Github Source
   * @param sourceOutput where to put the clones Repository
   */
  public createGithubSourceAction(sourceOutput: Artifact, oauthToken: cdk.SecretValue): GitHubSourceAction {
    return new GitHubSourceAction({
      actionName: 'my_github_source',
      owner: repoOwner,
      repo: 'spring-boot-cloud-deployment-learning',
      oauthToken: oauthToken,
      output: sourceOutput,
      branch: repoBranch,
    });
  }

  /**
   * Creates the BuildAction for Codepipeline build step
   * @param pipelineProject pipelineProject to use 
   * @param sourceActionOutput input to build
   * @param buildOutput where to put the ouput
   */
  public createBuildAction(pipelineProject: codebuild.PipelineProject, sourceActionOutput: Artifact,
    buildOutput: Artifact): CodeBuildAction {
    var buildAction = new CodeBuildAction({
      actionName: 'spring-boot-cloud-deployment-learning-build',
      project: pipelineProject,
      input: sourceActionOutput,
      outputs: [buildOutput],
    });
    buildAction.actionProperties.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    return buildAction;
  }

  public createEcsDeployAction(vpc: ec2.IVpc, ecrRepo: ecr.Repository, buildOutput: Artifact, pipelineProject: codebuild.PipelineProject): EcsDeployAction {
    return new EcsDeployAction({
      actionName: 'EcsDeployAction',
      service: this.createLoadBalancedFargateService(this, vpc, ecrRepo, pipelineProject).service,
      input: buildOutput,
    })
  };

  createLoadBalancedFargateService(scope: cdk.Construct, vpc: ec2.IVpc, ecrRepository: ecr.Repository, pipelineProject: codebuild.PipelineProject) {
    var fargateService = new ecspatterns.ApplicationLoadBalancedFargateService(scope, 'myLbFargateService', {
      vpc: vpc,
      memoryLimitMiB: 512,
      cpu: 256,
      assignPublicIp: true,
      // listenerPort: 8080,  
      taskImageOptions: {
        containerName: repoName,
        image: ecs.ContainerImage.fromRegistry("okaycloud/dummywebserver:latest"),
        containerPort: 8080,
      },
    });
    // fargateService.taskDefinition.executionRole?.addManagedPolicy((ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser')));
    return fargateService;
  }
}  
