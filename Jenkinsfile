pipeline {
    agent any

    environment {
        AWS_DEFAULT_REGION   = 'us-east-1'
        AWS_ECS_CLUSTER      = 'LearnJenkinsAppCluster-Prod'
        AWS_ECS_SERVICE_PROD = 'LearnJenkinsApp-TaskDefinition-Prod-service'
        REACT_APP_VERSION    = "1.0.$BUILD_NUMBER"
        APP_NAME             = 'myjenkinsapp'
        AWS_DOCKER_ECR       = '930271537876.dkr.ecr.us-east-1.amazonaws.com'
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
                    node --version
                    npm --version
                    npm ci
                    npm run build
                '''
            }
        }

        stage('Build Docker Image') {
            agent {
                docker {
                    image 'docker:24.0'
                    args '-u root:root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                sh '''
                    set -e
                    docker version
                    docker build -t $AWS_DOCKER_ECR/$APP_NAME:$REACT_APP_VERSION .
                '''
            }
        }

        stage('Login to ECR') {
            agent {
                docker {
                    image 'amazon/aws-cli:2.15.0'
                    args '--entrypoint="" -u root:root'
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'MY-AWS-TOKEN',
                                                  passwordVariable: 'AWS_SECRET_ACCESS_KEY',
                                                  usernameVariable: 'AWS_ACCESS_KEY_ID')]) {
                    sh '''
                        set -e
                        aws --version
                        aws ecr get-login-password --region $AWS_DEFAULT_REGION \
                            | docker login --username AWS --password-stdin $AWS_DOCKER_ECR
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            agent {
                docker {
                    image 'docker:24.0'
                    args '-u root:root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                sh '''
                    set -e
                    docker push $AWS_DOCKER_ECR/$APP_NAME:$REACT_APP_VERSION
                '''
            }
        }

        stage('Deploy to AWS ECS') {
            agent {
                docker {
                    image 'amazon/aws-cli:2.15.0'
                    args '--entrypoint="" -u root:root'
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

                        NEW_TD_ARN=$(aws ecs register-task-definition \
                            --cli-input-json file://aws/task-definition-prod.json \
                            | jq -r '.taskDefinition.taskDefinitionArn')

                        echo "New Task Definition ARN: $NEW_TD_ARN"

                        aws ecs update-service \
                            --cluster $AWS_ECS_CLUSTER \
                            --service $AWS_ECS_SERVICE_PROD \
                            --task-definition $NEW_TD_ARN

                        aws ecs wait services-stable \
                            --cluster $AWS_ECS_CLUSTER \
                            --services $AWS_ECS_SERVICE_PROD
                    '''
                }
            }
        }
    }
}
