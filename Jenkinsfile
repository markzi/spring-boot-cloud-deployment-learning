pipeline {
    agent any

    tools {
        maven 'maven'
    }
    stages {
        stage ('Initialize') {
                steps {
                    sh '''
                        echo "Running..."
                        java -version
                    '''
                }
        }
        stage('Build') {
            steps {
                sh 'mvn -DskipTests=true clean package'
            }
        }
        stage('Test') {
            steps {
                sh 'mvn test'
            }
            post {
                success {
                    junit 'target/surefire-reports/*.xml'
                }
            }
        }
        stage('ECR') {
            steps {
                sh '''
                  DOCKER_TAG=latest
                  CONTAINER_REGISTRY_BASE_URL=${AWS_ACCOUNT}.dkr.ecr.eu-west-2.amazonaws.com
                  ECR_URL=$(aws ssm get-parameter --name 'spring-boot-cloud-learning-deployment-learning-ecr-url' --profile ${AWS_PROFILE} --region ${AWS_REGION} | jq -r '.Parameter.Value')
                  docker build --tag ${ECR_URL}:${DOCKER_TAG} .
                  aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${CONTAINER_REGISTRY_BASE_URL}
                  docker push ${ECR_URL}:${DOCKER_TAG}
                '''
            }
        }     
    }
}
