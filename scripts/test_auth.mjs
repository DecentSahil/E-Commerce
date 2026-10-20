const API_BASE = 'http://127.0.0.1:8080/api/v1';

async function testLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  console.log(email, password, res.status, data.user?.role || data.message || data.error);
}

async function run() {
  await testLogin('admin@gmail.com', 'Admin@123');
  await testLogin('seller@gmail.com', 'Seller@123');
}

run();
