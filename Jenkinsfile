pipeline {
    agent any

    environment {
        AWS_DEFAULT_REGION     = 'us-east-1'
        AWS_ECS_CLUSTER        = 'LearnJenkinsAppCluster-Prod'
        AWS_ECS_SERVICE_PROD   = 'LearnJenkinsApp-TaskDefinition-Prod-service'
        REACT_APP_VERSION = "1.0.$BUILD_NUMBER"
        APP_NAME = 'myjenkinsapp'
        AWS_DOCKER_ECR = '930271537876.dkr.ecr.us-east-1.amazonaws.com'
    }

    stages {

        stage('Build Node App') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                    args '-u root:root'
                }
            }
            steps {
                sh '''
                    set -e
                    ls -la
                    node --version
                    npm --version
                    npm ci
                    npm run build
                    ls -la
                '''
            }
        }

        stage('Build Docker Image') {
            agent {
                docker {
                    image 'amazon/aws-cli:2.15.0'   // AWS CLI v2 official image
                    reuseNode true
                    args '-u root:root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'MY-AWS-TOKEN',
                                                passwordVariable: 'AWS_SECRET_ACCESS_KEY',
                                                usernameVariable: 'AWS_ACCESS_KEY_ID')]) {
                    sh '''
                        set -e
                        docker version
                        aws --version
                        docker build -t $AWS_DOCKER_ECR/$APP_NAME:$REACT_APP_VERSION .
                        aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_DOCKER_ECR
                        docker push $AWS_DOCKER_ECR/$APP_NAME:$REACT_APP_VERSION
                    '''
                }
            }
        }

        stage('Deploy to AWS ECS') {
            agent {
                docker {
                    image 'my-aws-cli'
                    reuseNode true
                    args '--entrypoint="" -u root:root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'MY-AWS-TOKEN',
                                                 passwordVariable: 'AWS_SECRET_ACCESS_KEY',
                                                 usernameVariable: 'AWS_ACCESS_KEY_ID')]) {
                    sh '''
                        set -e
                        aws --version
                        jq --version

                        # Register new task definition and capture full ARN
                        NEW_TD_ARN=$(aws ecs register-task-definition \
                            --cli-input-json file://aws/task-definition-prod.json \
                            | jq -r '.taskDefinition.taskDefinitionArn')

                        echo "New Task Definition ARN: $NEW_TD_ARN"

                        # Update ECS service with new task definition
                        aws ecs update-service \
                            --cluster $AWS_ECS_CLUSTER \
                            --service $AWS_ECS_SERVICE_PROD \
                            --task-definition $NEW_TD_ARN

                        # Wait until service is stable
                        aws ecs wait services-stable \
                            --cluster $AWS_ECS_CLUSTER \
                            --services $AWS_ECS_SERVICE_PROD
                    '''
                }
            }
        }
    }
}
