pipeline {
    agent any

    environment {
        NETLIFY_SITE_ID = "b0eda2c9-1a67-4c10-97e8-15a8b6e8ff59"
        NETLIFY_AUTH_TOKEN = credentials('netlify-token')
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
                    node --version
                    npm --version
                    npm ci
                    npm run build
                '''
            }
            post {
                success {
                    stash name: 'build-artifacts', includes: 'build/**'
                }
            }
        }

        stage('Run tests in parallel') {
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
                        unstash 'build-artifacts'
                        sh '''
                            npm ci
                            echo "Running unit tests..."
                            test -f build/index.html && echo "File exists" || exit 1
                            npm test
                        '''
                    }
                    post {
                        always {
                            junit allowEmptyResults: true, testResults: 'zest-results/junit.xml'
                        }
                    }
                }

                stage('End-to-End') {
                    agent {
                        docker {
                            image 'mcr.microsoft.com/playwright:v1.58.2-noble'
                            reuseNode true
                            args '-u root:root'
                        }
                    }
                    steps {
                        unstash 'build-artifacts'
                        sh '''
                            npm ci
                            npm install serve
                            
                            echo "Starting app..."
                            npx serve -s build &
                            sleep 10
                            
                            echo "Running Playwright tests..."
                            npx playwright test --reporter=html
                            
                            pkill -f serve || true
                        '''
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: true,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'playwright-report',
                                reportFiles: 'index.html',
                                reportName: 'Playwright HTML Report'
                            ])
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                    args '-u root:root'
                }
            }
            steps {
                unstash 'build-artifacts'
                sh '''
                    npm install -g netlify-cli
                    echo "Deploying to production. Site ID: $NETLIFY_SITE_ID"
                    
                    npx netlify deploy \
                        --prod \
                        --dir=build \
                        --site=$NETLIFY_SITE_ID \
                        --auth=$NETLIFY_AUTH_TOKEN
                '''
            }
        }
    }
}