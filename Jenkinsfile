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
                  ./cicd/scripts/ecr.sh --image-tag=latest --profile=${AWS_PROFILE} --region=${AWS_REGION}  --account=${AWS_ACCOUNT} --ecr-url-parameter=spring-boot-cloud-learning-deployment-learning-ecr-url
                '''
            }
        }     
    }
}
