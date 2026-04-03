pipeline {
    agent any

    options {
        timestamps() // adds timestamps to logs for better readability
    }

    stages {

        /*
        stage('Build') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    ls -la
                    node --version
                    npm --version
                    rm -rf node_modules package-lock.json
                    npm ci
                    npm run build
                    ls -la
                '''
            }
        }
        */

        stage('Run Tests in Parallel') {
            parallel {
                stage('Unit Test') {
                    agent {
                        docker {
                            image 'node:18-alpine'
                            reuseNode true
                        }
                    }
                    steps {
                        sh '''
                            ls -la
                            echo "Unit Test Stage"
                            test -f build/index.html && echo "File exists" || echo "File missing"

                            # Clean install to avoid stale node_modules
                            rm -rf node_modules package-lock.json
                            npm ci

                            # Explicitly install ansi-escapes to fix missing dependency
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
                            rm -rf node_modules package-lock.json
                            npm ci
                            npm install serve

                            node_modules/.bin/serve -s build &
                            
                            # Wait until the server is actually responding
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
