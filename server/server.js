import app from './app.js';

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`서버 실행 중: http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`포트 ${PORT} 이(가) 이미 사용 중입니다.`);
    process.exit(1);
  }
  throw err;
});
