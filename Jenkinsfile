pipeline {
    agent any

    environment{
        AWS_DEFAULT_REGION = 'us-east-1'
    }


    stages {

        stage('Build') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                    args '-u root:root'
                }
            }
            steps {
                sh '''
                    ls -la
                    node --version
                    npm --version
                    npm ci
                    npm run build
                    ls -la
                '''
            }
        }
        
        stage('Deploy to AWS'){
            agent{
                docker{
                    image 'amazon/aws-cli'
                    args '--entrypoint="" -u root:root'
                }
            }

            steps{
                withCredentials([usernamePassword(credentialsId: 'MY-AWS-TOKEN', passwordVariable: 'AWS_SECRET_ACCESS_KEY', usernameVariable: 'AWS_ACCESS_KEY_ID')]) {
                    sh '''
                        aws --version

                        aws ecs register-task-definition --cli-input-json file://aws/task-definition-prod.json

                        aws ecs update-service \
                                --cluster LearnJenkinsAppCluster-Prod \
                                --service LearnJenkinsApp-TaskDefinition-Prod-service \
                                --task-definition LearnJenkinsApp-TaskDefinition-Prod:2


                    '''
                }
                
            }
        }

    }
}
