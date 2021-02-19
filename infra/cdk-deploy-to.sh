#!/usr/bin/env bash
export CDK_DEPLOY_ACCOUNT=$1
export CDK_DEPLOY_REGION=$2
export IMAGE_TAG=$3
action=$4

if [[ $# -le 3 ]]; then
     echo 1>&2 "Provide action ( synth | deploy ) and AWS account and region "
     echo 1>&2 "Additional args are passed through to cdk deploy."
     exit 1
else
     shift; shift; shift; shift
     npx cdk $action "$@"
     exit $?
fi