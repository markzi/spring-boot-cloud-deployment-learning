pipeline {
    agent any

    tools {
        maven 'maven'
        jdk 'jdk11'
    }
    stages {
        stage ('Initialize') {
                steps {
                    sh '''
                        echo "Running..."
                        java -version
                        echo "PATH = ${PATH}"
                        echo "M2_HOME = ${M2_HOME}"       
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
                  ./cicd/scripts/ecr.sh --image-tag=latest --profile=${AWS_PROFILE} --region=${AWS_REGION}  --account=${AWS_ACCOUNT} --ecr-url-parameter=spring-boot-cloud-learning-deployment-learning-ecr-url
                '''
            }
        }   
        stage('Deploy') {
            steps {
                sh '''
                  ./cicd/scripts/ecr.sh --image-tag=latest --profile=${AWS_PROFILE} --region=${AWS_REGION}  --account=${AWS_ACCOUNT} --ecr-url-parameter=spring-boot-cloud-learning-deployment-learning-ecr-url
                  aws ecs update-service --cluster spring-boot-learning --service spring-boot-learning-service-development --task-definition arn:aws:ecs:eu-west-2:363021618303:task-definition/spring-boot-learning:6 --force-new-deployment --profile stray-digital-dev --region eu-west-2 --desired-count 2
                '''
            }
        }     
    }
}
