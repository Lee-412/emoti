cd scripts
chmod +x dockerize.sh
./dockerize.sh

if you don't have docker
sudo apt update
sudo apt install docker.io
sudo systemctl start docker
sudo systemctl enable docker
