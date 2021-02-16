#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { InfraStack } from '../lib/infra-stack';

const stackName = 'SpringBootCloudDeploymentLearningINFRA';

const app = new cdk.App();
new InfraStack(app, stackName, {
  env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION
  }
});