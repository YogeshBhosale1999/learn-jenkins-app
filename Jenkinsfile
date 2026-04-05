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
                    npm ci
                    npm run build
                '''
            }
        }

        stage('Build Docker Image') {
            agent {
                docker {
                    image 'docker:24.0'
                    reuseNode true
                    args '-u root:root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                sh '''
                    docker version
                    docker build -t $AWS_DOCKER_ECR/$APP_NAME:$REACT_APP_VERSION .
                '''
            }
        }

        stage('Push Docker Image to ECR') {
            agent {
                docker {
                    image 'docker:24.0'
                    reuseNode true
                    args '-u root:root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'MY-AWS-TOKEN',
                                                  passwordVariable: 'AWS_SECRET_ACCESS_KEY',
                                                  usernameVariable: 'AWS_ACCESS_KEY_ID')]) {
                    sh '''
                        # Get ECR login password using AWS CLI in a subshell
                        LOGIN_PASSWORD=$(aws ecr get-login-password --region $AWS_DEFAULT_REGION)

                        # Login to ECR
                        echo $LOGIN_PASSWORD | docker login --username AWS --password-stdin $AWS_DOCKER_ECR

                        # Push image
                        docker push $AWS_DOCKER_ECR/$APP_NAME:$REACT_APP_VERSION
                    '''
                }
            }
        }

        stage('Deploy to AWS ECS') {
            agent {
                docker {
                    image 'amazon/aws-cli:2.15.0'
                    reuseNode true
                    args '-u root:root'
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'MY-AWS-TOKEN',
                                                  passwordVariable: 'AWS_SECRET_ACCESS_KEY',
                                                  usernameVariable: 'AWS_ACCESS_KEY_ID')]) {
                    sh '''
                        aws --version

                        # Install jq inside AWS CLI container
                        apk add --no-cache jq
                        jq --version

                        NEW_TD_ARN=$(aws ecs register-task-definition \
                            --cli-input-json file://aws/task-definition-prod.json \
                            | jq -r '.taskDefinition.taskDefinitionArn')

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
