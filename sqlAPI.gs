// Function to call the @sql API
function callSqlApi(prompt, accessToken, env) {

  let baseUrl;

  // Select the correct base URL and access token based on the environment
  if (env === "DEV") {
    baseUrl = SQL_URL_DEV;
  } else if (env === "PROD") {
    baseUrl = SQL_URL_PROD;
  } else {
    throw new Error(`Invalid environment: ${env}. Must be 'DEV' or 'PROD'.`);
  }

  console.log(`DEBUG: SQL Endpoint URL: ${baseUrl}`);

  try {
    // Make the GET request
    const url = `${baseUrl}?q=${encodeURIComponent(prompt)}`;
    const headers = {
      Authorization: `Bearer ${accessToken}`
    };

    const response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: headers
    });

    console.log(`DEBUG: Received response with status code: ${response.getResponseCode()}`);

    if (response.getResponseCode() === 401) {
      return "Error Code 401: AUTH";
    }

    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());

      const parsedAnswer = JSON.parse(data.data || "[]");

      // Return the parsed answer as a string or "No data available."
      if (parsedAnswer.length > 0) {
        return JSON.stringify(parsedAnswer); // Convert to JSON string
      } else {
        return "No data available.";
      }
    }

  } catch (e) {
    console.error(`Error callSqlApi: ${e}`);
    return { answer: "No answer. Please try again later." };
  }
}

