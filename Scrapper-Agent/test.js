const fetch = require("node-fetch");

async function testAPI() {
    const response = await fetch("http://localhost:3000/api/generate-titles", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const data = await response.json();
    console.log(data);
}

void testAPI();
