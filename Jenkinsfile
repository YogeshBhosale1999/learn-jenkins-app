pipeline {
    agent any

    environment{
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
                    ls -la
                    node --version
                    npm --version
                    npm ci
                    npm run build
                    ls -la
                '''
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
                            image 'mcr.microsoft.com/playwright:v1.58.2-noble'
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
                                reportName: 'Playwright HTML Report',
                                reportTitles: '',
                                useWrapperFileDirectly: true
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
                sh '''
                    ls -la
                    npm install netlify-cli # local install
                    echo "Deploying to production. Site ID : $NETLIFY_SITE_ID"
                    npx netlify status
                    npx netlify deploy --prod --site $NETLIFY_SITE_ID --auth $NETLIFY_AUTH_TOKEN --dir=build
                    ls -la
                '''
            }
        }

    }
}
