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
    }
}
