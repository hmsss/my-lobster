# 方言音乐播放器 - 测试用例

**Author**: 高级测试工程师
**Last Updated**: 2026-03-19
**Version**: 1.0

---

## 测试范围

- 地区模块（省市级联选择器）
- 方言模块（列表查询、详情、搜索）
- 音乐模块（上传、列表、详情、更新、删除、搜索）
- 音频文件访问
- 接口通用规范

---

## 1. 地区模块测试用例

### TC-REG-001 获取省份列表

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 数据库已初始化，存在省份和城市数据 |
| **测试步骤** | 1. 调用 `GET /api/regions/provinces`<br>2. 检查响应状态码<br>3. 检查响应数据结构 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回省份列表，每个省份包含 id, name, pinyin, cityCount<br>4. 列表按 sort_order 和 pinyin 排序 |
| **测试数据** | - |
| **接口** | GET /api/regions/provinces |

### TC-REG-002 获取城市列表 - 正常场景

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 数据库中存在四川省（sichuan）及其城市 |
| **测试步骤** | 1. 调用 `GET /api/regions/cities?province_id=sichuan`<br>2. 检查响应状态码<br>3. 检查响应数据结构 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回城市列表，每个城市包含 id, provinceId, name, pinyin, dialectCount<br>4. 列表按 sort_order 和 pinyin 排序 |
| **测试数据** | province_id=sichuan |
| **接口** | GET /api/regions/cities |

### TC-REG-003 获取城市列表 - 省份不存在

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `GET /api/regions/cities?province_id=notexist`<br>2. 检查响应状态码<br>3. 检查错误码 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=1101<br>3. 响应 message="省份不存在" |
| **测试数据** | province_id=notexist |
| **接口** | GET /api/regions/cities |

### TC-REG-004 获取省市级联数据

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 数据库已初始化 |
| **测试步骤** | 1. 调用 `GET /api/regions/cascade`<br>2. 检查响应状态码<br>3. 检查数据结构 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回级联数据，格式为 [{value, label, children: [{value, label}]}]<br>4. 每个省份下有对应的城市列表 |
| **测试数据** | - |
| **接口** | GET /api/regions/cascade |

### TC-REG-005 获取城市列表 - 缺少必要参数

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `GET /api/regions/cities`（不传 province_id）<br>2. 检查响应状态码 |
| **预期结果** | 1. HTTP 状态码 422（Unprocessable Entity）<br>2. 返回参数校验错误信息 |
| **测试数据** | - |
| **接口** | GET /api/regions/cities |

---

## 2. 方言模块测试用例

### TC-DIA-001 获取方言列表 - 正常场景

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 数据库中存在成都市（chengdu）及其方言数据 |
| **测试步骤** | 1. 调用 `GET /api/dialect/list?city_id=chengdu`<br>2. 检查响应状态码<br>3. 检查响应数据结构 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回分页数据，包含 total, page, pageSize, items<br>4. 每个 item 包含 id, cityId, cityName, name, description, duration, durationText, audioUrl, fileSize, fileSizeText, createdAt<br>5. durationText 格式为 mm:ss |
| **测试数据** | city_id=chengdu |
| **接口** | GET /api/dialect/list |

### TC-DIA-002 获取方言列表 - 城市不存在

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `GET /api/dialect/list?city_id=notexist`<br>2. 检查响应状态码<br>3. 检查错误码 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=1102<br>3. 响应 message="城市不存在" |
| **测试数据** | city_id=notexist |
| **接口** | GET /api/dialect/list |

### TC-DIA-003 获取方言列表 - 分页参数边界

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | 数据库中存在方言数据 |
| **测试步骤** | 1. 调用 `GET /api/dialect/list?city_id=chengdu&page=1&page_size=1`<br>2. 调用 `GET /api/dialect/list?city_id=chengdu&page=999&page_size=20`<br>3. 调用 `GET /api/dialect/list?city_id=chengdu&page_size=50` |
| **预期结果** | 1. page_size=1 时返回 1 条数据<br>2. page=999 时返回空列表，total 不为 0<br>3. page_size=50 时正常返回（最大允许值） |
| **测试数据** | city_id=chengdu |
| **接口** | GET /api/dialect/list |

### TC-DIA-004 获取方言列表 - 无方言数据的城市

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | 存在一个没有方言数据的城市 |
| **测试步骤** | 1. 调用 `GET /api/dialect/list?city_id={无方言城市}`<br>2. 检查响应状态码<br>3. 检查数据 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. items 为空数组，total=0 |
| **测试数据** | - |
| **接口** | GET /api/dialect/list |

### TC-DIA-005 获取方言详情 - 正常场景

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 数据库中存在方言 ID 为 d001 的记录 |
| **测试步骤** | 1. 调用 `GET /api/dialect/d001`<br>2. 检查响应状态码<br>3. 检查响应数据结构 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回方言详情，包含 provinceName 字段<br>4. audioUrl 格式正确 |
| **测试数据** | dialect_id=d001 |
| **接口** | GET /api/dialect/{dialect_id} |

### TC-DIA-006 获取方言详情 - 方言不存在

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `GET /api/dialect/notexist`<br>2. 检查响应状态码<br>3. 检查错误码 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=1201<br>3. 响应 message="方言不存在" |
| **测试数据** | dialect_id=notexist |
| **接口** | GET /api/dialect/{dialect_id} |

### TC-DIA-007 搜索方言 - 正常场景

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | 数据库中存在包含"成都"关键字的方言 |
| **测试步骤** | 1. 调用 `GET /api/dialect/search?keyword=成都`<br>2. 检查响应状态码<br>3. 检查搜索结果 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回匹配的方言列表<br>4. 结果中的 cityName 或 name 包含"成都" |
| **测试数据** | keyword=成都 |
| **接口** | GET /api/dialect/search |

### TC-DIA-008 搜索方言 - 无匹配结果

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `GET /api/dialect/search?keyword=xyz123notexist`<br>2. 检查响应状态码<br>3. 检查搜索结果 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. items 为空数组，total=0 |
| **测试数据** | keyword=xyz123notexist |
| **接口** | GET /api/dialect/search |

---

## 3. 音乐模块测试用例

### TC-MUS-001 上传音乐 - 正常场景（MP3）

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | - |
| **测试步骤** | 1. 准备一个有效的 MP3 文件（< 20MB）<br>2. 调用 `POST /api/music/upload` 上传文件<br>3. 检查响应状态码<br>4. 检查返回的音乐信息 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回音乐信息，包含 id, name, audioUrl, fileSize, fileType<br>4. 文件保存到服务器 |
| **测试数据** | test.mp3（1MB） |
| **接口** | POST /api/music/upload |

### TC-MUS-002 上传音乐 - 带自定义名称

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | - |
| **测试步骤** | 1. 准备一个有效的 MP3 文件<br>2. 调用 `POST /api/music/upload`，同时传 name 参数<br>3. 检查返回的音乐名称 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 音乐名称为传入的 name 值 |
| **测试数据** | test.mp3, name="我的歌曲" |
| **接口** | POST /api/music/upload |

### TC-MUS-003 上传音乐 - 不支持的文件格式

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | - |
| **测试步骤** | 1. 准备一个不支持的文件格式（如 .txt）<br>2. 调用 `POST /api/music/upload` 上传文件<br>3. 检查响应错误码 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=2001<br>3. 响应 message 包含"文件格式不支持" |
| **测试数据** | test.txt |
| **接口** | POST /api/music/upload |

### TC-MUS-004 上传音乐 - 文件过大

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | - |
| **测试步骤** | 1. 准备一个超过 20MB 的 MP3 文件<br>2. 调用 `POST /api/music/upload` 上传文件<br>3. 检查响应错误码 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=2002<br>3. 响应 message 包含"文件大小超过限制" |
| **测试数据** | large.mp3（25MB） |
| **接口** | POST /api/music/upload |

### TC-MUS-005 上传音乐 - 支持的格式（WAV/OGG/M4A）

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | - |
| **测试步骤** | 1. 分别上传 .wav, .ogg, .m4a 格式文件<br>2. 检查每种格式的上传结果 |
| **预期结果** | 1. 所有格式都能成功上传<br>2. 返回正确的 fileType |
| **测试数据** | test.wav, test.ogg, test.m4a |
| **接口** | POST /api/music/upload |

### TC-MUS-006 获取音乐列表 - 正常场景

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 数据库中存在音乐数据 |
| **测试步骤** | 1. 调用 `GET /api/music/list`<br>2. 检查响应状态码<br>3. 检查响应数据结构 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回分页数据，包含 total, page, pageSize, items<br>4. 默认按 upload_time 降序排序 |
| **测试数据** | - |
| **接口** | GET /api/music/list |

### TC-MUS-007 获取音乐列表 - 排序功能

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | 数据库中存在多条音乐数据 |
| **测试步骤** | 1. 调用 `GET /api/music/list?sort_by=name&order=asc`<br>2. 调用 `GET /api/music/list?sort_by=duration&order=desc`<br>3. 检查排序结果 |
| **预期结果** | 1. 按 name 升序排列<br>2. 按 duration 降序排列 |
| **测试数据** | - |
| **接口** | GET /api/music/list |

### TC-MUS-008 获取音乐详情 - 正常场景

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 数据库中存在音乐记录 |
| **测试步骤** | 1. 先上传一首音乐获取 ID<br>2. 调用 `GET /api/music/{music_id}`<br>3. 检查响应状态码<br>4. 检查响应数据结构 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回音乐详情，包含所有字段 |
| **测试数据** | - |
| **接口** | GET /api/music/{music_id} |

### TC-MUS-009 获取音乐详情 - 音乐不存在

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `GET /api/music/notexist`<br>2. 检查响应错误码 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=2004<br>3. 响应 message="音乐不存在" |
| **测试数据** | music_id=notexist |
| **接口** | GET /api/music/{music_id} |

### TC-MUS-010 更新音乐信息 - 正常场景

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 数据库中存在音乐记录 |
| **测试步骤** | 1. 调用 `PATCH /api/music/{music_id}` 更新 name, artist, album<br>2. 检查响应状态码<br>3. 再次查询验证更新结果 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回更新后的音乐信息 |
| **测试数据** | name="新歌名", artist="歌手", album="专辑" |
| **接口** | PATCH /api/music/{music_id} |

### TC-MUS-011 更新音乐信息 - 音乐不存在

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `PATCH /api/music/notexist`<br>2. 检查响应错误码 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=2004<br>3. 响应 message="音乐不存在" |
| **测试数据** | music_id=notexist |
| **接口** | PATCH /api/music/{music_id} |

### TC-MUS-012 删除音乐 - 正常场景

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 数据库中存在音乐记录 |
| **测试步骤** | 1. 先上传一首音乐<br>2. 调用 `DELETE /api/music/{music_id}`<br>3. 检查响应状态码<br>4. 再次查询验证已删除 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 数据库记录被删除<br>4. 文件被删除 |
| **测试数据** | - |
| **接口** | DELETE /api/music/{music_id} |

### TC-MUS-013 删除音乐 - 音乐不存在

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `DELETE /api/music/notexist`<br>2. 检查响应错误码 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=2004<br>3. 响应 message="音乐不存在" |
| **测试数据** | music_id=notexist |
| **接口** | DELETE /api/music/{music_id} |

### TC-MUS-014 搜索音乐 - 正常场景

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | 数据库中存在音乐数据 |
| **测试步骤** | 1. 调用 `GET /api/music/search?keyword=测试`<br>2. 检查搜索结果 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 响应 code=0<br>3. 返回匹配的音乐列表 |
| **测试数据** | keyword=测试 |
| **接口** | GET /api/music/search |

---

## 4. 音频文件访问测试用例

### TC-AUD-001 访问方言音频文件

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 服务器上存在方言音频文件 |
| **测试步骤** | 1. 从方言列表获取 audioUrl<br>2. 调用 `GET /audio/dialect/{path}`<br>3. 检查响应状态码和 Content-Type |
| **预期结果** | 1. HTTP 状态码 200<br>2. Content-Type 为 audio/mpeg<br>3. 返回音频文件内容 |
| **测试数据** | - |
| **接口** | GET /audio/dialect/* |

### TC-AUD-002 访问音乐文件

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | 已上传音乐文件 |
| **测试步骤** | 1. 上传音乐文件<br>2. 从返回的 audioUrl 访问文件<br>3. 检查响应状态码和 Content-Type |
| **预期结果** | 1. HTTP 状态码 200<br>2. Content-Type 正确<br>3. 返回音频文件内容 |
| **测试数据** | - |
| **接口** | GET /audio/music/* |

### TC-AUD-003 访问不存在的音频文件

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `GET /audio/dialect/notexist.mp3`<br>2. 检查响应状态码 |
| **预期结果** | 1. HTTP 状态码 404 |
| **测试数据** | - |
| **接口** | GET /audio/* |

---

## 5. 通用接口规范测试用例

### TC-COM-001 响应格式验证

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **前置条件** | - |
| **测试步骤** | 1. 调用任意成功接口<br>2. 检查响应格式 |
| **预期结果** | 1. 响应包含 code, message, data 字段<br>2. 成功时 code=0<br>3. message 为字符串 |
| **测试数据** | - |
| **接口** | 所有接口 |

### TC-COM-002 健康检查接口

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `GET /health`<br>2. 检查响应 |
| **预期结果** | 1. HTTP 状态码 200<br>2. 返回 {"status": "ok"} |
| **测试数据** | - |
| **接口** | GET /health |

### TC-COM-003 API 文档访问

| 项目 | 内容 |
|------|------|
| **优先级** | P2 |
| **前置条件** | - |
| **测试步骤** | 1. 调用 `GET /docs`<br>2. 调用 `GET /openapi.json` |
| **预期结果** | 1. /docs 返回 Swagger UI 页面<br>2. /openapi.json 返回 OpenAPI 规范 JSON |
| **测试数据** | - |
| **接口** | GET /docs, GET /openapi.json |

---

## 6. 参数校验测试用例

### TC-VAL-001 分页参数边界值

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **前置条件** | - |
| **测试步骤** | 1. 测试 page=0<br>2. 测试 page=-1<br>3. 测试 page_size=0<br>4. 测试 page_size=51（超过最大值） |
| **预期结果** | 1. page=0 返回 422 错误<br>2. page=-1 返回 422 错误<br>3. page_size=0 返回 422 错误<br>4. page_size=51 返回 422 错误 |
| **测试数据** | - |
| **接口** | GET /api/dialect/list, GET /api/music/list |

---

## 测试用例统计

| 模块 | P0 | P1 | P2 | 总计 |
|------|----|----|----|----|
| 地区模块 | 4 | 1 | 0 | 5 |
| 方言模块 | 5 | 4 | 0 | 9 |
| 音乐模块 | 10 | 4 | 0 | 14 |
| 音频访问 | 2 | 1 | 0 | 3 |
| 通用规范 | 1 | 1 | 1 | 3 |
| 参数校验 | 0 | 1 | 0 | 1 |
| **总计** | **22** | **12** | **1** | **35** |
