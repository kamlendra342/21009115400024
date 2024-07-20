app.get('/numbers/:numberId', (req, res) => {
    const numberId = req.params.numberId;
    if (!TEST_SERVER_URLS[numberId]) {
      return res.status(400).json({ error: 'Invalid number ID' });
    }
  
    // Make request to test server
    const options = {
      method: 'GET',
      hostname: '20.244.56.144',
      path: `/test/${numberId}`,
      timeout: 500
    };
  
    const testReq = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const numbersReceived = JSON.parse(data).numbers;
  
          // Store numbers, removing duplicates and oldest numbers if window size is exceeded
          numbers = [...new Set([...numbers, ...numbersReceived])].slice(-WINDOW_SIZE);
  
          // Calculate average
          const avg = numbers.reduce((acc, curr) => acc + curr, 0) / numbers.length;
  
          // Return response
          return res.json({
            numbers: numbersReceived,
            windowPrevState: numbers.slice(0, -numbersReceived.length),
            windowCurrState: numbers,
            avg
          });
        } catch (error) {
          console.error(`Error parsing response from test server: ${error}`);
          return res.status(500).json({ error: 'Error parsing response from test server' });
        }
      });
    });
  
    testReq.on('error', (error) => {
      console.error(`Error making request to test server: ${error}`);
      if (error.code === 'ETIMEDOUT') {
        return res.status(500).json({ error: 'Timeout fetching numbers from test server' });
      } else {
        return res.status(500).json({ error: 'Error fetching numbers from test server' });
      }
    });
  
    testReq.on('timeout', () => {
      console.error('Timeout making request to test server');
      testReq.abort();
    });
  
    testReq.end();
  });