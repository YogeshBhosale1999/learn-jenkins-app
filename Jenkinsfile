pipeline {
    agent any

    environment{
        AWS_DEFAULT_REGION = 'us-east-1'
        AWS_ECS_CLUSTER = 'LearnJenkinsAppCluster-Prod'
        AWS_ECS_SERVICE_PROD = 'LearnJenkinsApp-TaskDefinition-Prod-service'
        AWS_ECS_TASK_DEFINITION = 'LearnJenkinsApp-TaskDefinition-Prod'

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

        stage('Build Docker Image'){
            agent {
                docker {
                    image 'amazon/aws-cli'
                    reuseNode true
                    args '--entrypoint="" -u root:root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }

            steps{
                sh '''
                    amazon-linux-extras install docker
                    docker build -t myjenkinsapp:latest . 
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

                        yum install jq -y

                        LATEST_TD_REVISION=$(aws ecs register-task-definition --cli-input-json file://aws/task-definition-prod.json | jq '.taskDefinition.revision')

                        aws ecs update-service \
                                --cluster $AWS_ECS_CLUSTER \
                                --service $AWS_ECS_SERVICE_PROD \
                                --task-definition $AWS_ECS_TASK_DEFINITION:$LATEST_TD_REVISION

                        aws ecs wait services-stable \
                                --cluster $AWS_ECS_CLUSTER \
                                --services $AWS_ECS_SERVICE_PROD


                    '''
                }
                
            }
        }

    }
}
