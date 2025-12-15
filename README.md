# 🔗 Slink | 多功能短链系统

在此项目基础上完全重构: https://github.com/crazypeace/Url-Shorten-Worker

## ✨ 项目简介

**Slink** 是一个轻量级、高性能的多功能文件管理服务，基于 **Cloudflare Workers** 和 **KV 存储**，具备免费且快速的短链、图床、记事本三功能个模块，未来还将添加更多实用模块。该项目旨在提供一个易于部署、功能完善的自托管文件管理解决方案。

<table>
  <tr>
    <td><img src="https://b2qq.24811213.xyz/2025-12/1765507370-image.webp" alt="短链管理页" style="max-width:100%;"></td>
    <td><img src="https://b2qq.24811213.xyz/2025-12/1765507405-image.webp" alt="图床管理页" style="max-width:100%;"></td>
  </tr>
</table>

## 🚀 核心功能

### 通用功能

- **KV 数据管理：** 提供管理面板，支持 **添加、查询、删除** 链接
- **自定义名：** 所有模块均可自定义名称并支持**中文名**
- **访问统计：** 可选开启，对每个短链接记录**访问次数**
- **阅后即焚：** 可选开启，链接被**访问后**立即从 KV 中**删除**
- **二维码生成：** 在管理列表页，支持即时生成短链接的 **二维码**
- **暗黑模式：** 支持手动切换**明亮**模式或**暗黑**模式
- **响应式设计：** 采用响应式设计，适配**手机**、**平板**等设备访问
- **反向查询：** 支持根据短链接 Key 或文件名**查询原始**数据

### 各模块功能

> [!NOTE]
> `记事本模块` 与 `剪贴板模块` 尚未开发完成，敬请期待！  

| 模块                 | 功能               | 描述                                        |
| ------------------ | ---------------- | ----------------------------------------- |
| **短链模块**           | 短链生成<br>唯一链接     | 支持将任意长网址生成短链接<br>对同一长链接，只生成一个短链接 |
| **图床模块**           | 图片上传<br>直链预览     | 上传图片到图床，返回图片的访问链接<br>可生成预览图与访问直链          |
| **记事本模块**     | 文本存储<br>Markdown | 可存储任意文本内容<br>计划支持 Markdown 语法             |

---

## 🧩 部署方式

详见 [博客教程](https://blog.notett.com/post/2025/12/251212-slink/)

环境变量：

| 变量名             | 默认值     | 描述                                     |
| ----------------- | ------- | -------------------------------------- |
| **ADMIN**         | admin   | 管理密码，访问 `/admin` 进入主页                   |
| **PASSWORD**      | apipass | API 秘钥，小白不用管它                          |
| **UNIQUE_LINK**   | true    | 是否开启唯一链接功能（相同 URL 只生成一个短链）             |
| **CUSTOM_LINK**   | true    | 是否允许用户自定义短链 Key                        |
| **OVERWRITE_KV**  | true    | 是否允许覆盖已存在的自定义短链 Key                    |
| **SNAPCHAT_MODE** | false   | 是否启用阅后即焚模式（访问一次后删除）                    |
| **VISIT_COUNT**   | false   | 是否启用访问计数功能                             |
| **LOAD_KV**       | true    | 是否允许从 KV 加载数据，需要绑定变量名为 `LINKS` 的 KV 空间 |

---

## API 接口说明

- API 端点：`/<ADMIN>`，示例 `/admin`，`add` 命令需要添加`/<type>`，示例 `/admin/link`
- 请求体：`"Content-type": "application/json"`

| 方法  | 参数                          | cmd 命令 | 描述       |
| ---- | ----------------------------- | ------- | ----------- |
| POST | cmd, url, key, password, type | add    | 创建短链接   |
| POST | cmd, key, password            | del    | 删除短链接   |
| POST | cmd, key, password            | qry    | 查询短链接   |
| POST | cmd, key, password            | qrycnt | 查询访问计数 |

- add 命令说明：
  - 当 key 为空时，生成随机短链接
  - 当 key 为单个字符串，使用该字符串作为短链接 Key
  - key 不支持数组格式，即不支持批量创建短链接
  - type 为链接模式，支持 `link`、`img`、`note`、`paste` 四种类型

- del、qry、qrycnt 命令说明：
  - 当 key 为空时，对所有短链接操作
  - 当 key 为单个字符串时，对该短链接操作，格式为 `key`
  - 当 key 为数组时，对数组中的每个短链接操作，格式为 `["key1", "key2", "key3"]`

详见 [API 文档](https://github.com/yutian81/slink/blob/main/API.md)

---

## ⭐ Star 星星走起

> [!IMPORTANT]
> 请顺手点个 ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=yutian81/slink&type=date&legend=top-left)](https://www.star-history.com/#yutian81/slink&type=date&legend=top-left)
