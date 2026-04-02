pipeline {
    agent any

    stages {
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
                    npm ci
                    npm run build
                    ls -la
                '''
            }
        }
        stage('Test'){
            steps {
                sh '''
                    ls -la
                    node --version
                    npm --version
                    echo "Test Stage"
                    test -f build/index.html && echo "File exists" || echo "File missing"
                    npm test
                    ls -la
                '''
            }
        }
    }
}
