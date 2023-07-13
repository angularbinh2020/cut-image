pipeline {
  agent any
  tools {nodejs "nodejs16"}
  stages {
    stage('Build') {
        steps {
          sh 'npm install --legacy-peer-deps'
          sh 'npm run build'
        }
    }
    stage('Remote and Build - Prod') {
       when {
                expression {
                    return env.GIT_BRANCH == "origin/release"
                }
            }
        steps {
            script {
                 def remote = [:]
                remote.name = "$SERVER_3"
                remote.host = "$SERVER_3"
                remote.user = 'root'
                remote.port = 2021
                remote.password = "$SERVER_3_PASSWORD"
                remote.allowAnyHosts = true
                sshCommand remote: remote, command: "rm -rf  /home/verse/panorama_service/dist/*"
                sshCommand remote: remote, command: "rm -rf  /home/verse/panorama_service/src/*"
                sshCommand remote: remote, command: "rm -rf  /home/verse/panorama_service/ssl/*"
                sshCommand remote: remote, command: "scp -r root@$JENKINS_SERVER:${WORKSPACE}/dist/ /home/verse/panorama_service/"
                sshCommand remote: remote, command: "scp -r root@$JENKINS_SERVER:${WORKSPACE}/src/ /home/verse/panorama_service/"
                sshCommand remote: remote, command: "scp root@$JENKINS_SERVER:${WORKSPACE}/package.json /home/verse/panorama_service/"
                sshCommand remote: remote, command: "scp root@$JENKINS_SERVER:${WORKSPACE}/Dockerfile /home/verse/panorama_service/"

                sshCommand remote: remote, command: "rm -rf  /home/verse/panorama_service_i2/dist/*"
                sshCommand remote: remote, command: "rm -rf  /home/verse/panorama_service_i2/src/*"
                sshCommand remote: remote, command: "rm -rf  /home/verse/panorama_service_i2/ssl/*"
                sshCommand remote: remote, command: "scp -r root@$JENKINS_SERVER:${WORKSPACE}/dist/ /home/verse/panorama_service_i2/"
                sshCommand remote: remote, command: "scp -r root@$JENKINS_SERVER:${WORKSPACE}/src/ /home/verse/panorama_service_i2/"
                sshCommand remote: remote, command: "scp root@$JENKINS_SERVER:${WORKSPACE}/package.json /home/verse/panorama_service_i2/"
                sshCommand remote: remote, command: "scp root@$JENKINS_SERVER:${WORKSPACE}/Dockerfile /home/verse/panorama_service_i2/"
                sshCommand remote: remote, command: "docker rm -f panorama_service && docker rm -f panorama_service_i2 &&  docker-compose -f /home/verse/docker-compose.yml up -d --build"
            }
        }
    }

     stage('Remote and Build - Dev') {
        when {
            expression {
                return env.GIT_BRANCH == "origin/master"
            }
        }
         steps {
            script {
                def remote = [:]
                remote.name = "${JENKINS_SERVER}"
                remote.host =  "${JENKINS_SERVER}"
                remote.user = 'root'
                remote.port = 22
                remote.password = "${JENKINS_PW}"
                remote.allowAnyHosts = true
                sshCommand remote: remote, command: "rm -rf  /home/verse/panorama_service/dist/*"
                sshCommand remote: remote, command: "rm -rf  /home/verse/panorama_service/src/*"
                sshCommand remote: remote, command: "rm -rf  /home/verse/panorama_service/ssl/*"
                sshCommand remote: remote, command: "scp -r ${WORKSPACE}/dist/ /home/verse/panorama_service/"
                sshCommand remote: remote, command: "scp -r ${WORKSPACE}/src/ /home/verse/panorama_service/"
                sshCommand remote: remote, command: "scp ${WORKSPACE}/package.json /home/verse/panorama_service/"
                sshCommand remote: remote, command: "scp ${WORKSPACE}/.env /home/verse/panorama_service/"
                sshCommand remote: remote, command: "scp ${WORKSPACE}/Dockerfile /home/verse/panorama_service/"
                sshCommand remote: remote, command: "docker rm -f panorama_service && docker-compose -f /home/verse/docker-compose.yml up -d --build"
            }
        }
    }
  }
}