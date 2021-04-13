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

CONTAINER_REGISTRY_BASE_URL=${ACCOUNT}.dkr.ecr.eu-west-2.amazonaws.com
ECR_URL=$(aws ssm get-parameter --name ${ECR_URL_PARAMETER} --profile ${PROFILE} --region ${REGION} | jq -r '.Parameter.Value')
docker build --tag ${ECR_URL}:${IMAGE_TAG} .
aws ecr get-login-password --profile ${PROFILE} --region ${REGION} | docker login --username AWS --password-stdin ${CONTAINER_REGISTRY_BASE_URL}
docker push ${ECR_URL}:${IMAGE_TAG}