# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

## TODO
- S3 bucket creation
 - when destroying the stack these generated ones, if not empty, are still there.
- Remove hardcoded values
 - should be passed in as parameters
- CloudWatch
 - log groups
- Infrastructure
 - ESC
 - Blue/Green
- cdk-deploy-to.sh
  - include parameter check
  ```
    if [ -n "$1" ]
    then
    echo "Hello $1."
    else
    echo "No parameters found."
    fi
  ```
  - use switches
  - prompt to delete resources which do not get deleted by CDK and will fail the destory if not done manually before its
