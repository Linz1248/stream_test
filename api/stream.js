export default function handler(req, res) {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = new URL(req.url, `http://${req.headers.host}`);
  const text = url.searchParams.get('text') || '流式输出的文本';
  const delay = parseInt(url.searchParams.get('delay') || '500', 10);
  const errorAt = url.searchParams.get('errorAt') ? parseInt(url.searchParams.get('errorAt'), 10) : null;
  
  // Array.from 正确拆分 Unicode（支持中文、emoji）
  const chars = Array.from(text);
  let i = 0;
  
  const interval = setInterval(() => {
    try {
      // 模拟错误场景
      if (errorAt !== null && i === errorAt) {
        res.write(`event: error\ndata: ${JSON.stringify({error_msg: '模拟流式输出过程中遇到错误'})}\n\n`);
        clearInterval(interval);
        res.end();
        return;
      }
      
      // 正常输出字符
      if (i < chars.length) {
        res.write(`event: message\ndata: ${JSON.stringify({content: chars[i]})}\n\n`);
        i++;
      } else {
        // 输出结束标记
        res.write(`event: close\ndata: closed\n\n`);
        clearInterval(interval);
        res.end();
      }
    } catch (e) {
      clearInterval(interval);
    }
  }, delay);
  
  // 客户端断开时清理
  req.on('close', () => {
    clearInterval(interval);
  });
}
