#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CicdStack } from '../lib/cicd-stack';

const stackName = 'SpringBootCloudDeploymentLearningCICD';

const app = new cdk.App();
new CicdStack(app, stackName, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
