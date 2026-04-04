pipeline {
    agent any

    environment {
        AWS_DEFAULT_REGION     = 'us-east-1'
        AWS_ECS_CLUSTER        = 'LearnJenkinsAppCluster-Prod'
        AWS_ECS_SERVICE_PROD   = 'LearnJenkinsApp-TaskDefinition-Prod-service'
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
                    image 'docker:24.0'   // use official Docker image
                    reuseNode true
                    args '-u root:root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                sh '''
                    set -e
                    docker version
                    docker build -t myjenkinsapp:latest .
                '''
            }
        }

        stage('Deploy to AWS ECS') {
            agent {
                docker {
                    image 'amazon/aws-cli'
                    reuseNode true
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
                        yum install -y jq

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
