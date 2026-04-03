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
                }
            }
        }
    }

    post {
        always {
            junit 'zest-results/junit.xml'
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
