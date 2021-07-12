#!/usr/bin/env bash

for i in "$@"
do
case $i in
    --image-tag=*)
    export IMAGE_TAG="${i#*=}"
    shift
    ;;
    --profile=*)
    export PROFILE="${i#*=}"
    shift
    ;;
    --region=*)
    export REGION="${i#*=}"
    shift
    ;;
    --account=*)
    export ACCOUNT="${i#*=}"
    shift
    ;;
    --ecr-url-parameter=*)
    export ECR_URL_PARAMETER="${i#*=}"
    shift
    ;;
    *)
    ;;
esac
done


REVISION=$(aws ecs describe-task-definition --task-definition spring-boot-learning --profile ${PROFILE} --region ${REGION} | jq -r '.taskDefinition.revision')
