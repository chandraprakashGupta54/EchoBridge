const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.post('/darpan', async (req, res) => {
  try {
    const form = new URLSearchParams(req.body).toString();
    const response = await axios.post(
      'https://ngodarpan.gov.in/index.php/ajaxcontroller/get_ngo_list',
      form,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).send("Failed to fetch Darpan data");
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`);
});