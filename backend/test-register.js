const http = require("http");

const data = JSON.stringify({
  company_name: "Test Company",
  slug: "test-company-" + Date.now(),
  contact_email: "contact@test.com",
  contact_phone: "+251911111111",
  admin_name: "Admin User",
  admin_email: "admin+" + Date.now() + "@test.com",
  password: "password123",
});

const options = {
  hostname: "localhost",
  port: 4000,
  path: "/api/auth/register-company",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS:`, res.headers);
  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    console.log("BODY:", responseData);
  });
});

req.on("error", (e) => {
  console.error(`problem with request: ${e.message}`);
});

console.log("Sending:", data);
req.write(data);
req.end();
