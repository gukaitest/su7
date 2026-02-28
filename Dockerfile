# Dockerfile
FROM nginx:alpine

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/

# 复制本地构建的静态文件
COPY dist /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80
