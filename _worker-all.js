RITE_KV === "false" ? false : true,
    snapchat_mode: env.SNAPCHAT_MODE === "true" ? true : false,
    visit_count: env.VISIT_COUNT === "true" ? true : false,
    load_kv: env.LOAD_KV === "false" ? false : true,
  };

  // 定义响应头
  const base_cors_header = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // 包含 GET 以确保短链访问正常
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const html_response_header = { ...base_cors_header, "Content-type": "text/html;charset=UTF-8", };
  const json_response_header = { ...base_cors_header, "Content-type": "application/json", };
  const text_response_header = { ...base_cors_header, "Content-type": "text/plain;charset=UTF-8", };

  // 定义常量
  const password_value = config.password.trim();
  const html404 = await get404Html();
  const response404 = () => new Response(html404, { headers: html_response_header, status: 404 });

  // 定义密码和系统类型
  const requestURL = new URL(request.url)
  const pathSegments = requestURL.pathname.split("/").filter(p => p.length > 0)
  const system_password = pathSegments.length > 0 ? pathSegments[0] : "";
  const system_type = pathSegments.length >= 2 ? pathSegments[1] : "link";
    
  // 处理 OPTIONS 请求
  if (request.method === "OPTIONS") { return new Response(``, { headers: text_response_header }); }

  // -----------------------------------------------------------------
  // 【API 接口处理】 (POST 请求)
  // -----------------------------------------------------------------
  if (request.method === "POST") {
      if (pathSegments.length === 0) {
        return new Response(`{"status":400, "error":"错误: URL中未提供密码"}`, { headers: json_response_header, status: 400 });
      }
      if (system_password !== password_value) {
        return new Response(`{"status":401,"key": "", "error":"错误: 无效的密码"}`, { headers: json_response_header, status: 401 });
      }
      
      let req;
      try {
          req = await request.json();
      } catch (e) {
          return new Response(`{"status":400, "error":"错误: 无效的JSON格式"}`, { headers: json_response_header, status: 400 });
      }
      
      const { cmd: req_cmd, url: req_url, key: req_key } = req;
      
      // 受保护 Key 检查
      const isKeyProtected = (key) => protect_keylist.includes(key);
      let response_data = { status: 400, error: `错误: 未知的命令 ${req_cmd}` };
      let http_status = 400;

      switch (req_cmd) {
          case "config":
              response_data = {
                status: 200,
                visit_count: config.visit_count,
                custom_link: config.custom_link
              };
              http_status = 200;
              break;
          
          case "add":
              if (system_type === "link" && !await checkURL(req_url)) {
                  response_data.error = `错误: 无效的URL`;
                  http_status = 400;
                  break;
              }
              
              let final_key;
              http_status = 200;
              if (config.custom_link && req_key) {
                  if (isKeyProtected(req_key)) {
                      response_data = { status: 403, key: req_key, error: "错误: key在保护列表中" };
                      http_status = 403;
                  } else if (!config.overwrite_kv && await is_url_exist(req_key, env)) {
                      response_data = { status: 409, key: req_key, error: "错误: 已存在的key" };
                      http_status = 409;
                  } else {
                      await env.LINKS.put(req_key, req_url);
                      final_key = req_key;
                  }
              } else if (config.unique_link) {
                  const url_sha512 = await sha512(req_url);
                  const existing_key = await is_url_exist(url_sha512, env);
                  if (existing_key) {
                      final_key = existing_key;
                  } else {
                      final_key = await save_url(req_url, env);
                      if (final_key) { await env.LINKS.put(url_sha512, final_key); }
                  }
              } else { final_key = await save_url(req_url, env); }
              
              // 统一处理成功或KV写入失败的返回
              if (final_key && http_status === 200) { 
                  response_data = { status: 200, key: final_key, error: "" };
              } else if (!final_key && http_status === 200) {
                  response_data = { status: 507, key: "", error: "错误: 达到KV写入限制" };
                  http_status = 507;
              }
              break;
          
          case "del":
              http_status = 200;
              if (isKeyProtected(req_key)) {
                  response_data = { status: 403, key: req_key, error: "错误: key在保护列表中" };
                  http_status = 403;
              } else {
                  await env.LINKS.delete(req_key);
                  if (config.visit_count) { await env.LINKS.delete(req_key + "-count"); }
                  response_data = { status: 200, key: req_key, error: "" };
              }
              break;

          case "qry":
              http_status = 200;
              if (isKeyProtected(req_key)) {
                  response_data = { status: 403, key: req_key, error: "错误: key在保护列表中" };
                  http_status = 403;
              } else {
                  const value = await env.LINKS.get(req_key);
                  response_data = value != null
                      ? { status: 200, error: "", key: req_key, url: value }
                      : ({ status: 404, key: req_key, error: "错误: key不存在" }, http_status = 404);
              }
              break;

          case "qrycnt":
              http_status = 200;
              if (!config.visit_count) {
                  response_data = { status: 400, key: req_key, error: "错误: 统计功能未开启" };
                  http_status = 400;
              } else if (isKeyProtected(req_key)) {
                  response_data = { status: 403, key: req_key, error: "错误: key在保护列表中" };
                  http_status = 403;
              } else {
                  const value = await env.LINKS.get(req_key + "-count");
                  const final_count = value ?? "0"; // 默认为0
                  response_data = { status: 200, error: "", key: req_key, count: final_count };
              }
              break;

          case "qryall":
              http_status = 200;
              if (!config.load_kv) {
                  response_data = { status: 400, error: "错误: 载入kv功能未启用" };
                  http_status = 400;
                  break;
              }
              
              const keyList = await env.LINKS.list();
              let kvlist = [];
              if (keyList?.keys) {
                  // 使用 filter 明确过滤条件
                  const filterKeys = (item) => !(
                      isKeyProtected(item.name) || 
                      item.name.endsWith("-count") || 
                      item.name.length === 128
                  );      
                  const filteredKeys = keyList.keys.filter(filterKeys);
                  const urlPromises = filteredKeys.map(item => env.LINKS.get(item.name));
                  const urls = await Promise.all(urlPromises);
                  kvlist = filteredKeys.map((item, index) => ({ "key": item.name, "value": urls[index] }));
                  response_data = { status: 200, error: "", kvlist: kvlist };
              } else {
                  response_data = { status: 500, error: "错误: 加载key列表失败" };
                  http_status = 500;
              }
              break;
      }
      return new Response(JSON.stringify(response_data), { headers: json_response_header, status: http_status });
  }

  // -----------------------------------------------------------------
  // 【前端网页访问】（GET 请求）
  // -----------------------------------------------------------------
  // 处理 / 根路径，返回404
  if (pathSegments.length === 0) { return response404(); }

  // 处理 /密码 和 /密码/系统类型 路径
  if (system_password === password_value) {
    let target_html_url;
    if (pathSegments.length === 1) { target_html_url = main_html; }
    else if (pathSegments.length >= 2) { target_html_url = `${system_base_url}/${system_type}/index.html`; }
    else { return response404(); }
    // 统一处理页面加载和替换
    if (target_html_url) {
      let response = await fetch(target_html_url);
      if (response.status !== 200) { return response404(); }
      let index = await response.text();
      index = index.replace(/__PASSWORD__/gm, password_value);
      return new Response(index, { headers: html_response_header, status: 200 })
    }
  }

  // 处理 /短链 或 /图床Key 的访问
  let path = decodeURIComponent(pathSegments[0] || "");
  const params = requestURL.search;
  let value = await env.LINKS.get(path); 
  if (protect_keylist.includes(path)) { value = "" }
  if (!value) { return response404(); }

  // 计数功能
  if (config.visit_count) {
      let count = await env.LINKS.get(path + "-count"); 
      count = count ? parseInt(count) + 1 : 1;
      ctx.waitUntil(env.LINKS.put(path + "-count", count.toString()));
  }

  // 阅后即焚模式
  if (config.snapchat_mode) { 
      ctx.waitUntil(env.LINKS.delete(path));
      if (config.visit_count) { ctx.waitUntil(env.LINKS.delete(path + "-count")); }
  }
  
  if (params) { value = value + params }

  // 智能判断系统类型返回不同响应
  const imageResult = getBlobAndContentType(value);
  if (imageResult) {
    try {
        return new Response(imageResult.blob, {
            headers: {
                "Content-Type": imageResult.contentType,
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*",
            }, status: 200
        });
    } catch (e) {
      console.error("图片处理错误:", e);
      return new Response(value, { headers: text_response_header, status: 500 });
    }
  }
  else if (checkURL(value)) { // 判断是否为 URL，是则为短链接)
    return Response.redirect(value, 302);
  } 
  else {
    return new Response(value, { headers: text_response_header, status: 200 });
  }
}
