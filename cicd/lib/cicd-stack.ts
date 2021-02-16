import * as cdk from '@aws-cdk/core';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecr from '@aws-cdk/aws-ecr';
import * as codebuild from '@aws-cdk/aws-codebuild';
import { ManagedPolicy } from '@aws-cdk/aws-iam';
import { GitHubSourceAction, CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';
import { RemovalPolicy } from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam'

const repoName = "spring-boot-cloud-deployment-learning";
const repoBranch = "main";
const repoOwner = "markzi";

export class CicdStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // retrieve Github access token
    var oauthToken = cdk.SecretValue.secretsManager('github/oauth/token');

    let sourceOutput: Artifact;
    let buildOutput: Artifact;

    // ECR repository
    const ecrRepository = new ecr.Repository(this, repoName, {
      repositoryName: repoName,
      removalPolicy: RemovalPolicy.DESTROY
    });

    var pipelineProject = this.createPipelineProject(ecrRepository);  
    var infrastructurePlanPipelineProject = this.createInfrastructurePlanPipelineProject(ecrRepository);
    var infrastructureDeployPipelineProject = this.createInfrastructureDeployPipelineProject(ecrRepository);

    sourceOutput = new Artifact();
    buildOutput = new Artifact();

    var githubSourceAction = this.createGithubSourceAction(sourceOutput, oauthToken);
    var buildAction = this.createBuildAction(pipelineProject, sourceOutput, buildOutput);

    var infrastructurePlanBuildAction = this.createPlanAction(infrastructurePlanPipelineProject, sourceOutput);
    var infrastructureDeployBuildAction = this.createPlanAction(infrastructureDeployPipelineProject, sourceOutput);

    var pipeline = new Pipeline(this, `${repoName}_pipeline`, {
      stages: [
        {
          stageName: 'Source',
          actions: [githubSourceAction]
        },
        {
          stageName: 'BuildImage',
          actions: [buildAction]
        },
        {
          stageName: 'BuildPlan',
          actions: [infrastructurePlanBuildAction]
        },
        {
          stageName: 'DeployPlan',
          actions: [infrastructureDeployBuildAction]
        },
      ],
      pipelineName: `${repoName}_pipeline`
      //artifactBucket: artifactBucket
    });
  }

  // ----------------------- some helper methods -----------------------
  /**
   * create the Pipeline Project wuth Buildspec and stuff
   */
  private createPipelineProject(ecrRepo: ecr.Repository): codebuild.PipelineProject {
    var pipelineProject = new codebuild.PipelineProject(this, `${repoName}_codepipeline`, {
      projectName: `${repoName}_codepipeline`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
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
      buildSpec: codebuild.BuildSpec.fromSourceFilename("cicd/buildspec.yml"),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM)
    });
    pipelineProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    return pipelineProject;
  }

  /**
   * create the Infrastructure Plan Pipeline Project wuth Buildspec and stuff
   */
  private createInfrastructurePlanPipelineProject(ecrRepo: ecr.Repository): codebuild.PipelineProject {
    var pipelineProject = new codebuild.PipelineProject(this, `${repoName}_infra_plan_codepipeline`, {
      projectName: `${repoName}_infra_plan_codepipeline`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
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
        "CDK_DEPLOY_ACCOUNT": {
          value: process.env["CDK_DEPLOY_ACCOUNT"]
        },
        "CDK_DEPLOY_REGION": {
          value: process.env["CDK_DEPLOY_REGION"]
        },

      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename("infra/buildspec_plan.yml"),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM)
    });
    pipelineProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    pipelineProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'));
    pipelineProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonVPCReadOnlyAccess'));

    return pipelineProject;
  }

  /**
   * create the Infrastructure Deploy Pipeline Project wuth Buildspec and stuff
   */
  private createInfrastructureDeployPipelineProject(ecrRepo: ecr.Repository): codebuild.PipelineProject {
    var pipelineProject = new codebuild.PipelineProject(this, `${repoName}_infra_deploy_codepipeline`, {
      projectName: `${repoName}_infra_deploy_codepipeline`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
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
        "CDK_DEPLOY_ACCOUNT": {
          value: process.env["CDK_DEPLOY_ACCOUNT"]
        },
        "CDK_DEPLOY_REGION": {
          value: process.env["CDK_DEPLOY_REGION"]
        },

      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename("infra/buildspec_deploy.yml"),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM)
    });
    pipelineProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    pipelineProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'));
    pipelineProject.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonVPCReadOnlyAccess'));

    return pipelineProject;
  }  

  /**
   * creates Github Source
   * @param sourceOutput where to put the clones Repository
   */
  public createGithubSourceAction(sourceOutput: Artifact, oauthToken: cdk.SecretValue): GitHubSourceAction {
    return new GitHubSourceAction({
      actionName: `${repoName}_source`,
      owner: repoOwner,
      repo: repoName,
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
      actionName: `${repoName}_build`,
      project: pipelineProject,
      input: sourceActionOutput,
      outputs: [buildOutput],
    });
    buildAction.actionProperties.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    return buildAction;
  }

    /**
   * Creates the BuildAction for Codepipeline build step
   * @param pipelineProject pipelineProject to use 
   * @param sourceActionOutput input to build
   */
  public createPlanAction(pipelineProject: codebuild.PipelineProject, sourceActionOutput: Artifact): CodeBuildAction {
    var buildAction = new CodeBuildAction({
      actionName: `${repoName}_plan`,
      project: pipelineProject,
      input: sourceActionOutput
    });
    buildAction.actionProperties.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));
    return buildAction;
  }
}