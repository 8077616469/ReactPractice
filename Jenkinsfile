pipeline {
    agent any
    environment {
        IMAGE = "localhost:5000/my-react-app:${BUILD_NUMBER}"
    }
    stages {
        stage('Checkout') {
            steps {
                git url: '/home/jenkins-git-server/my-react-app.git', branch: 'master'
            }
        }
        stage('Build Image') {
            steps {
                sh "docker build -t ${IMAGE} -t localhost:5000/my-react-app:latest ."
            }
        }
        stage('Push Image') {
            steps {
                sh "docker push ${IMAGE}"
                sh "docker push localhost:5000/my-react-app:latest"
            }
        }
        stage('Deploy to K8s') {
            steps {
                sh "kubectl set image deployment/my-react-app my-react-app=${IMAGE} --record"
                sh "kubectl rollout status deployment/my-react-app"
            }
        }
    }
}
