## 🚀 Slink API 文档

- **API端点:** `/<password>/<ADMIN>` (对于查询/删除/计数)，ADMIN 由环境变量 `ADMIN` 自定义，默认值为 `admin`
- **API端点:** `/<password>/<type>` (对于添加)
- **请求方法:** `POST`
- **请求头:** `Content-Type: application/json`
- **请求体:** 必须包含 `cmd` 和 `password` 字段
- **受保护 Key:** `["password", "link", "img", "note"]` 列表中的 Key 无法被 API 操作

---

## 参数说明

- **cmd**：操作命令，必须。支持 `add`（添加）、`qry`（查询）、`del`（删除）、`qrycnt`（查询访问计数）
- **password**：`api` 秘钥，必须。默认值为 `apipass`，可以通过环境变量 `PASSWORD` 自定义
- **type**：功能模块，仅 `add` 命令需要。支持 `link`（短链）、`img`（图床）、`note`（记事本）
- **url**：源 URL，仅 `add` 命令需要。`link`模式时为长链 URL，`img`模式时为图片base64码，`note`模式时为文本内容
- **key**：自定义短链 Key，可选。如果不提供，系统将自动生成一个随机 Key
  - 支持中文
  - 支持单个或数组形式
  - 单个时为字符串 `key`
  - 数组时为字符串数组 `["key1", "key2", "key3"]`
  - 如果为空，则操作全部

## 1. 添加短链

### 💻 `curl` 示例 (自定义 Key)

- 此命令不支持数组形式的 `key` 参数

```bash
curl -X POST https://<worker_domain>/<password>/<type> \
-H "Content-Type: application/json" \
-d '{
    "cmd": "add",
    "url": "https://www.google.com/search?q=custom+key+example",
    "key": "mykey",
    "type": "link",
    "password": "apipass"
}'
```

#### 响应示例 (`status: 200`)

```json
{
  "status": 200,
  "key": "随机或自定义的短链Key", 
  "error": ""
}
```

---

## 2. 查询短链

### 查询单个

#### 💻 `curl` 示例（多个）

```bash
curl -X POST https://<worker_domain>/<password> \
-H "Content-Type: application/json" \
-d '{
    "cmd": "qry",
    "key": link1,
    "password": "apipass"
}'
```

#### 响应示例 (`status: 200`)

```json
{
  "status": 200,
  "error": "",
  "qrylist": [
    {
      "key": "link1",
      "value": "https://example.com/long/url/one"
    }
  ]
}
```

### 查询多个

#### 💻 `curl` 示例

```bash
curl -X POST https://<worker_domain>/<password> \
-H "Content-Type: application/json" \
-d '{
    "cmd": "qry",
    "key": ["link1","mykey","imageA"],
    "password": "apipass"
}'
```

#### 响应示例 (`status: 200`)

```json
{
  "status": 200,
  "error": "",
  "qrylist": [
    {
      "key": "link1",
      "value": "https://example.com/long/url/one"
    },
    {
      "key": "mykey",
      "value": "https://www.google.com/search?q=mykey"
    },
    {
      "key": "imageA",
      "value": "data:image/png;base64,iVBORw0KG..."
    }
  ]
}
```

---

## 3. 删除链接

### 删除单个

#### 💻 `curl` 示例

```bash
curl -X POST https://<worker_domain>/<password> \
-H "Content-Type: application/json" \
-d '{
    "cmd": "del",
    "key": "link1",
    "password": "apipass"
}'
```

#### 响应示例 (`status: 200`)

```json
{
  "status": 200,
  "error": "",
  "deleted_count": 1,
  "dellist": [
    {
      "key": "link1",
      "value": "https://example.com/long/url/one"
    }
  ] 
}
```

### 删除多个

#### 💻 `curl` 示例

```bash
curl -X POST https://<worker_domain>/<password> \
-H "Content-Type: application/json" \
-d '{
    "cmd": "del",
    "key": ["link1","link2"],
    "password": "apipass"
}'
```

#### 响应示例 (`status: 200`)

```json
{
  "status": 200,
  "error": "",
  "deleted_count": 2,
  "dellist": [
    {
      "key": "link1",
      "value": "https://example.com/long/url/one"
    },
    {
      "key": "link2",
      "value": "https://example.com/long/url/two"
    }
  ] 
}
```

---

## 4. 查询访问计数

### 查询单个

#### 💻 `curl` 示例

```bash
curl -X POST https://<worker_domain>/<password> \
-H "Content-Type: application/json" \
-d '{
    "cmd": "qrycnt",
    "key": "link1",
    "password": "apipass"
}'
```

#### 响应示例 (`status: 200`)

```json
{
  "status": 200,
  "error": "",
  "countlist": [
    {
      "key": "link1",
      "value": "https://example.com/long/url/one",
      "count": "42"
    }
  ]
}
```

### 查询多个

#### 💻 `curl` 示例

```bash
curl -X POST https://<worker_domain>/<password> \
-H "Content-Type: application/json" \
-d '{
    "cmd": "qrycnt",
    "key": ["link1","link2"],
    "password": "apipass"
}'
```

#### 响应示例 (`status: 200`)

```json
{
  "status": 200,
  "error": "",
  "countlist": [
    {
      "key": "link1",
      "value": "https://example.com/long/url/one",
      "count": "42"
    },
    {
      "key": "link2",
      "value": "https://example.com/long/url/two",
      "count": "15"
    }
  ]
}
```

---

## 直接访问 / 重定向 (非 API)

当用户通过浏览器访问 Worker URL 时触发的功能。

| **访问路径**                                 | **行为**               |
| ------------------------------------------- | ---------------------- |
| `https://<YOUR_WORKER_URL>/`                | 返回 `404` 页面         |
| `https://<YOUR_WORKER_URL>/<ADMIN>`         | 短链页面                |
| `https://<YOUR_WORKER_URL>/<ADMIN>/img`     | 图床页面                |
| `https://<YOUR_WORKER_URL>/<ADMIN>/note`    | 笔记页面                |
| `https://<YOUR_WORKER_URL>/短链key`         | 直接访问短链接           |
