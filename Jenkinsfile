pipeline {
    agent any

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

        stage('Run Demo tests in parallel') {
            parallel {
                stage('Test') {
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
                            echo "Test Stage"
                            test -f build/index.html && echo "File exists" || echo "File missing"
                            npm test
                            ls -la
                        '''
                    }
                    post {
                        always {
                            junit 'zest-results/junit.xml'
                        }
                    }
                }

                stage('End-to-End') {
                    agent {
                        docker {
                            image 'my-playwright:latest'
                            reuseNode true
                            args '-u root:root'
                        }
                    }
                    steps {
                        sh '''
                            npm install serve
                            nohup node_modules/.bin/serve -s build > serve.log 2>&1 &
                            sleep 10
                            npx playwright test --reporter=html
                            kill $(jobs -p) || true
                        '''
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: false,
                                icon: '',
                                keepAll: false,
                                reportDir: 'playwright-report',
                                reportFiles: 'index.html',
                                reportName: 'Playwright Local HTML Report',
                                reportTitles: '',
                                useWrapperFileDirectly: true
                            ])
                        }
                    }
                }
            }
        }

        stage('Deploying to Staging Environment') {
            agent {
                docker {
                    image 'amazon/aws-cli'
                    args '--entrypoint="" -u root:root'
                    reuseNode true
                }
            }
            environment {
                AWS_S3_BUCKET = 'learn-jenkins-yjb'
                STAGING_PATH = "staging-${env.BUILD_ID}"
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'MY-AWS-TOKEN',
                                                 passwordVariable: 'AWS_SECRET_ACCESS_KEY',
                                                 usernameVariable: 'AWS_ACCESS_KEY_ID')]) {
                    sh '''
                        aws s3 sync build s3://$AWS_S3_BUCKET/$STAGING_PATH --delete
                        aws s3 ls s3://$AWS_S3_BUCKET/$STAGING_PATH
                    '''
                }
            }
        }

        stage('Staging : End-to-End Testing') {
            agent {
                docker {
                    image 'my-playwright:latest'
                    reuseNode true
                    args '-u root:root'
                }
            }
            environment {
                CI_ENVIRONMENT_URL = "http://learn-jenkins-yjb.s3-website-ap-south-1.amazonaws.com/${STAGING_PATH}/"
            }
            steps {
                sh '''
                    npx playwright test --reporter=html
                '''
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: false,
                        icon: '',
                        keepAll: false,
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright Staging E2E HTML Report',
                        reportTitles: '',
                        useWrapperFileDirectly: true
                    ])
                }
            }
        }

        stage('Approval Process') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    input message: 'Do you wish to deploy to production?', ok: 'Yes, deploy'
                }
            }
        }

        stage('Deploying to Prod Environment') {
            agent {
                docker {
                    image 'amazon/aws-cli'
                    args '--entrypoint="" -u root:root'
                    reuseNode true
                }
            }
            environment {
                AWS_S3_BUCKET = 'learn-jenkins-yjb-prod'
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'MY-AWS-TOKEN',
                                                 passwordVariable: 'AWS_SECRET_ACCESS_KEY',
                                                 usernameVariable: 'AWS_ACCESS_KEY_ID')]) {
                    sh '''
                        aws s3 sync build s3://$AWS_S3_BUCKET --delete
                        aws s3 ls s3://$AWS_S3_BUCKET
                    '''
                }
            }
        }

        stage('Production : End-to-End Testing') {
            agent {
                docker {
                    image 'my-playwright:latest'
                    reuseNode true
                    args '-u root:root'
                }
            }
            environment {
                CI_ENVIRONMENT_URL = "http://learn-jenkins-yjb-prod.s3-website-ap-south-1.amazonaws.com/"
            }
            steps {
                sh '''
                    npx playwright test --reporter=html
                '''
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: false,
                        icon: '',
                        keepAll: false,
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright Production E2E HTML Report',
                        reportTitles: '',
                        useWrapperFileDirectly: true
                    ])
                }
            }
        }
    }
}
