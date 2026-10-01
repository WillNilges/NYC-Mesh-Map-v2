pipeline {
    environment {
        GIT_REPO = "https://github.com/mon33k/NYC-Mesh-Map-v2"
        BRANCH = "main"
        IMAGE_TAG = "main"
        IMAGE_REPO_NAME = "nycmeshnet/map-v2"
        DOCKER_HUB_NYCMESHNET_MAPV2_PAT = credentials('docker-hub-nycmeshnet-mapv2-pat')
    }
    agent any
    stages {
        stage("Clone Git Repo") {
            steps {
                git branch: "${BRANCH}", url: "${GIT_REPO}"
            }
        }
        stage("Build Docker image") {
            steps {
                script {
                    sh "docker build -t ${IMAGE_REPO_NAME}:${IMAGE_TAG} ."
                }
            }
        }
        stage("Docker Login") {
            steps {
                script {
                    sh "echo ${DOCKER_HUB_NYCMESHNET_MAPV2_PAT} | docker login -u nycmeshnet --password-stdin"
                }
            }
        }
        stage("Push Docker image") {
            steps {
                script {
                    sh "docker push ${IMAGE_REPO_NAME}:${IMAGE_TAG}"
                }
            }
        }
        stage("Deploy to dev3") {
            agent {
                docker { image 'nycmeshnet/map-v2-builder@sha256:ce6a219d0bafb1394fc402e8f50a2f6dd64c16f0226fdfac8314c58264c94e8f' }
            }
            steps {
                withCredentials([
                    file(credentialsId: 'map-v2-deploy-secrets-yaml', variable: 'SECRETS_YAML'),
                    file(credentialsId: 'map-v2-kubeconfig', variable: 'KUBECONFIG')
                ]) {
                    sh """
                        helm version
                        cd infra/helm
                        helm --kubeconfig ${KUBECONFIG} --namespace map-v2 upgrade --install map-v2 -f ${SECRETS_YAML} map-v2
                    """
                }
            }
        }
    }
}

