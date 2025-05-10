# Emoti: Chatbot Cảm Xúc & Nhận Diện Khuôn Mặt

> Một ứng dụng tích hợp nhận diện khuôn mặt, phân tích cảm xúc và chatbot phản hồi theo tâm trạng người dùng. Giao diện đẹp, dễ dùng, chạy trực tiếp qua Docker và ReactJS.

---

## 🚀 1. Clone Dự Án

```bash
git clone https://github.com/Lee-412/emoti.git
cd emoti
```

⚙️ 2. Khởi Động Backend (DeepFace + Flask)
Chạy container backend bằng Docker. Backend dùng để xử lý ảnh, phân tích khuôn mặt, cảm xúc, xác thực...

Cách chạy:

```bash
  cd deepface/scripts
  ./dockerize.sh

```

💻 3. Khởi Động Giao Diện Người Dùng (React UI)
Giao diện chatbot trực quan, có webcam, nhận diện khuôn mặt realtime, trả lời qua khung chat.
```bash
  cd ../../deepface-react-ui
  npm install
  npm run start
```

📋 4. Môi Trường & Công Nghệ
🔹 Frontend: React, HTML/CSS thuần, webcam API

🔹 Backend: Python Flask, DeepFace, Docker

🔹 AI Cảm Xúc: DeepFace analyze() API

🔹 Chatbot Offline: Dữ liệu .json, không cần gọi API AI

📎 5. Ghi chú
Đảm bảo bạn đã cài Docker và Node.js v16+
🪟 CÀI ĐẶT DOCKER TRÊN WINDOWS
✅ Bước 1: Cài Docker Desktop
Tải về từ trang chính thức:
👉 https://www.docker.com/products/docker-desktop/

Chạy file .exe và làm theo hướng dẫn.

Sau khi cài xong, mở Docker Desktop và đợi trạng thái "Running".

🔧 Yêu cầu:
Windows 10/11 (64-bit)

Bật WSL 2 và Virtualization trong BIOS

Nếu chưa cài WSL2, Docker sẽ hướng dẫn bạn khi cài đặt. Hoặc bạn có thể tự cài bằng lệnh:

powershell

wsl --install
✅ Kiểm tra:
```bash


docker --version
docker run hello-world

```
🐧 CÀI ĐẶT DOCKER TRÊN UBUNTU (LINUX)


✅ Bước 1: Cài Docker Engine
```bash


# Gỡ bản Docker cũ nếu có
sudo apt-get remove docker docker-engine docker.io containerd runc

# Cập nhật repo
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg lsb-release

# Thêm GPG key chính thức
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Thêm repo Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

```
✅ Bước 2: Thêm quyền sudo (nếu cần)
```bash


sudo usermod -aG docker $USER
newgrp docker  # hoặc logout/login lại

```
✅ Kiểm tra:
```bash


docker --version
docker run hello-world
```
Nếu cần build lại backend: docker compose build --no-cache