pipeline {
    agent any

    tools {
        maven 'maven'
        jdk '11'
    }
    stages {
        stage ('JDK 11 Test') {
            tools {
                jdk '11'
            }            
            steps {
                sh '''
                    echo "Running..."
                    echo "JAVA HOME ${JAVA_HOME}"
                    echo "WHICH JAVA"
                    which java
                    java -version
                '''
            }
        }
        stage ('JDK 14 Test') {
            tools {
                jdk '14'
            }            
            steps {
                sh '''
                    echo "Running..."
                    echo "JAVA HOME ${JAVA_HOME}"
                    echo "WHICH JAVA"
                    which java
                    java -version
                '''
            }
        }        
        stage('Build') {
            steps {
                sh 'mvn -DskipTests=true clean package'
            }
        }
        // stage('Test') {
        //     steps {
        //         sh 'mvn test'
        //     }
        //     post {
        //         success {
        //             junit 'target/surefire-reports/*.xml'
        //         }
        //     }
        // }
        // stage('ECR') {
        //     steps {
        //         sh '''
        //           ./cicd/scripts/ecr.sh --image-tag=latest --profile=${AWS_PROFILE} --region=${AWS_REGION}  --account=${AWS_ACCOUNT} --ecr-url-parameter=spring-boot-cloud-learning-deployment-learning-ecr-url
        //         '''
        //     }
        // }   
        // stage('Deploy') {
        //     steps {
        //         sh '''
        //           ./cicd/scripts/ecr.sh --image-tag=latest --profile=${AWS_PROFILE} --region=${AWS_REGION}  --account=${AWS_ACCOUNT} --ecr-url-parameter=spring-boot-cloud-learning-deployment-learning-ecr-url
        //           aws ecs update-service --cluster spring-boot-learning --service spring-boot-learning-service-development --task-definition arn:aws:ecs:eu-west-2:363021618303:task-definition/spring-boot-learning:6 --force-new-deployment --profile stray-digital-dev --region eu-west-2 --desired-count 2
        //         '''
        //     }
        // }     
    }
}
