const API_BASE = 'http://localhost:8080/api/v1';

async function checkPending() {
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'Admin@123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;

  const pendingRes = await fetch(`${API_BASE}/auth/admin/sellers/pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Pending status:', pendingRes.status);
  const pendingData = await pendingRes.json();
  console.log('Pending sellers:', pendingData);
}

checkPending();
