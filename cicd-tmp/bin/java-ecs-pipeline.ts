#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { JavaEcsStack } from '../lib/java-ecs-stack';

const app = new cdk.App();
new JavaEcsStack(app, 'JavaEcsStack', { 
    env: { 
      account: process.env.CDK_DEFAULT_ACCOUNT, 
      region: process.env.CDK_DEFAULT_REGION 
    }
});
