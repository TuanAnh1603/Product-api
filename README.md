# Product API - CI/CD Lab

REST API CRUD sản phẩm dùng Node.js, Express, Mongoose và MongoDB. Docker image mặc định: `anhtuan1603/product-api` (đổi `DOCKER_USERNAME` nếu dùng tài khoản khác).

## Yêu cầu
- VS Code, Git, Docker Desktop/Engine, Node.js 22+
- Tài khoản GitHub và Docker Hub

## Chạy local (Node trực tiếp)
1. `cp .env.example .env` (Windows PowerShell: `Copy-Item .env.example .env`).
2. Khởi động MongoDB local hoặc tạo container: `docker run -d --name nammongodb -p 27017:27017 -v product_mongo_data:/data/db mongo:7`.
3. Trong `.env`, đặt `MONGO_URI=mongodb://localhost:27017/productdb`.
4. `npm ci` rồi `npm start`.
5. Kiểm tra `http://localhost:3000/health` và API tại `/api/products`.

## Chạy toàn bộ bằng Compose
`docker compose up -d --build` rồi xem `docker compose ps` và `docker compose logs -f product-api`. Mở `http://localhost:3000/health`. Trong mạng Compose, API kết nối MongoDB qua hostname `mongodb`, không dùng `localhost`.

## CRUD
- `POST /api/products` JSON `{ "pid":"P001", "pname":"Mouse", "price":250000, "quantity":10 }`
- `GET /api/products`; `GET /api/products/P001`
- `PUT /api/products/P001` JSON `{ "price":230000, "quantity":8 }`
- `DELETE /api/products/P001`

## Kiểm thử CI
Cài dependency `npm ci`. Khi MongoDB và API đang chạy, dùng `npm test`. Test kiểm tra health, tạo/đọc/cập nhật/xóa, dữ liệu sai và pid trùng. GitHub Actions `test-productci.yml` tự chạy test trên push/PR vào `main`. `test-productci-prod.yml` chạy test, build Docker image và xác minh Docker healthcheck; khi push main thì publish lên Docker Hub.

## GitHub Secrets và Docker Hub
Trong repository Settings → Secrets and variables → Actions, tạo:
- `DOCKER_USERNAME`: Docker Hub username.
- `DOCKER_PASSWORD`: Docker Hub access token (không dùng mật khẩu tài khoản).

Workflow publish image `username/product-api:latest` và `username/product-api:<commit-sha>` sau khi test đạt.

## CD về Docker Engine local
GitHub-hosted runner không truy cập được Docker Engine trên máy cá nhân. Muốn job `deploy-local` tự chạy, cài GitHub Actions self-hosted runner trên máy có Docker Engine, đăng ký runner với label `product-api-local` (giữ thêm label `self-hosted`). Bảo vệ runner, chỉ cho repository tin cậy sử dụng; không chạy PR không tin cậy trên runner này. Đảm bảo Docker Engine đang chạy và runner có quyền gọi Docker. Job sẽ pull image theo SHA, chạy `docker compose -f docker-compose-prod.yaml up -d`, sau đó chờ container healthy.

Để thử production Compose thủ công: `docker login`, đặt `DOCKER_USERNAME` và `IMAGE_TAG` trong shell hoặc file `.env` phù hợp, sau đó chạy `docker compose -f docker-compose-prod.yaml pull` và `docker compose -f docker-compose-prod.yaml up -d`. Không commit credentials. Lệnh dừng: `docker compose -f docker-compose-prod.yaml down` (không thêm `-v` nếu muốn giữ dữ liệu).

## Đánh giá theo yêu cầu bài
1. Xóa memory cũ: thao tác tài khoản/ChatGPT, không thuộc source code.
2-3. Tạo repo và clone: thực hiện/kiểm tra trên GitHub và máy cá nhân.
4. Docker Desktop: xác nhận Docker extension/Engine từ VS Code.
5-8. MongoDB, CRUD, Dockerfile, Compose: cấu hình trong repo.
9. Healthcheck cả MongoDB và API.
10. CI cơ bản: `test-productci.yml`.
11. CI production: `test-productci-prod.yml` test DB-backed CRUD và container health.
12. CD publish Docker Hub sau CI.
13. `docker-compose-prod.yaml` pull image registry.
14. Tự deploy local chỉ khi self-hosted runner đã cài và kết nối. File workflow đơn thuần không tự kết nối tới máy cá nhân.

Lưu ý: không commit `.env`, Docker credentials, `.git/` hoặc `node_modules/` vào gói chia sẻ.
