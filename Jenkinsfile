pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Run Tests in Parallel') {
            parallel {
                stage('Unit Test') {
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
                            echo "Unit Test Stage"
                            test -f build/index.html && echo "File exists" || echo "File missing"

                            rm -rf node_modules
                            npm ci

                            # Ensure ansi-escapes is present
                            npm install ansi-escapes --save-dev

                            npm test
                            ls -la
                        '''
                    }
                }

                stage('End-to-End Test') {
                    agent {
                        docker {
                            image 'mcr.microsoft.com/playwright:v1.58.2-noble'
                            reuseNode true
                            args '-u root:root'
                        }
                    }
                    steps {
                        sh '''
                            rm -rf node_modules
                            npm ci
                            npm install serve

                            node_modules/.bin/serve -s build &
                            for i in {1..30}; do
                              if curl -s http://localhost:3000 > /dev/null; then
                                echo "Server is up!"
                                break
                              fi
                              echo "Waiting for server..."
                              sleep 2
                            done

                            npx playwright test --reporter=html
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
