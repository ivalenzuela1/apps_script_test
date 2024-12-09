// Function to call the agent API
function callAgentApi(prompt, accessToken, env) {
  // Select the correct base URL and access token based on the environment
  let baseUrl;

  if (env === "DEV") {
    baseUrl = AGENT_URL_DEV;
  } else if (env === "PROD") {
    baseUrl = AGENT_URL_PROD;
  } else {
    throw new Error(`Invalid environment: ${env}. Must be 'DEV' or 'PROD'.`);
  }

  // Determine the endpoint based on the prompt
  const endpointPath = determineAgentEndpoint(prompt);

  // Remove "@ntb" and "@now" from the prompt
  const sanitizedPrompt = prompt.replace("@ntb", "").replace("@now", "").trim();
  console.log(`DEBUG: Sanitized Prompt: ${sanitizedPrompt}`);

  const endpointUrl = `${baseUrl}/${endpointPath}?q=${encodeURIComponent(sanitizedPrompt)}&p=google`;
  console.log("DEBUG: Preparing to call the agent API");
  console.log(`DEBUG: Endpoint URL: ${endpointUrl}`);

  try {
    const response = UrlFetchApp.fetch(endpointUrl, {
      method: "get",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    console.log(`DEBUG: Received response with status code: ${response.getResponseCode()}`);

    if (response.getResponseCode() !== 200) {
      console.log(`DEBUG: Response body: ${response.getContentText()}`);
      throw new Error(`HTTP error! status: ${response.getResponseCode()}`);
    }

    const data = JSON.parse(response.getContentText());
    console.log(`DEBUG: Response JSON: ${JSON.stringify(data)}`);

    if (data.status === "success") {
      const answer = data.result;
      console.log(`DEBUG: Extracted answer: ${answer}`);

      if (!answer || answer.length === 0) {
        console.log("DEBUG: Empty answer received from the agent.");
        return "The agent is unable to answer this question at this time.";
      }

      return answer;
    } else {
      console.log(`DEBUG: API call not successful. Status: ${data.status}`);
      return "Not successful";
    }
  } catch (e) {
    console.error(`ERROR: General error occurred: ${e}`);
    return "No answer. Please try again later.";
  }
}

function determineAgentEndpoint(prompt) {
  const mappings = [
    { value: "@now", endpoint: "servicenow" },
    { value: "@ntb", endpoint: "nautobot" }
  ];

  if (prompt.includes("@ntb") && prompt.includes("@now")) {
    Logger.log("Detected both '@ntb' and '@now' in prompt. Using endpoint: multi-agents");
    return "multi-agents";
  }

  for (const mapping of mappings) {
    if (prompt.includes(mapping.value)) {
      Logger.log(`Detected '${mapping.value}' in prompt. Using endpoint: ${mapping.endpoint}`);
      return mapping.endpoint;
    }
  }

  throw new Error("No matching endpoint found for the given prompt");
}



// Placeholder for API calls
function callDocApi(prompt, env) {
  // Replace with actual API logic
  return `Processed Doc API for: ${prompt}`;
}

function callSqlApi(prompt, env) {
  // Replace with actual API logic
  return `Processed SQL API for: ${prompt}`;
}

function runTests11(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  const token = spreadsheet.getRangeByName('token').getValue();

  const rowValues = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

  rowValues.forEach((prompt, colIndex) => {
    if (colIndex === 0 || !prompt.trim()) return; // Skip the first column and empty prompts

    Logger.log(`Processing column ${colIndex + 1} with prompt: ${prompt}`);
    const answer = callAgentApi(prompt, token);

    const colValues = sheet.getRange(1, colIndex + 1, sheet.getLastRow()).getValues().flat();
    const lastRowIndex = colValues.findIndex(val => !val) + 1 || colValues.length + 1;

    sheet.getRange(lastRowIndex, colIndex + 1).setValue(answer);
    // Introduce a small delay to ensure the cell update is applied before adjusting height
    // Utilities.sleep(200);

    try {
      // Dynamically adjust row height
      sheet.setRowHeight(lastRowIndex, 130);
      Logger.log(`Row height set to 130 for row ${lastRowIndex}`);
    } catch (error) {
      Logger.log(`Error setting row height for row ${lastRowIndex}: ${error.message}`);
    }

    const timestamp = new Date();
    const successMessage = `SUCCESS - ${timestamp.toISOString()}`;
    sheet.getRange(lastRowIndex + 1, colIndex + 1).setValue(successMessage);

    Logger.log(`Answer and success message written to column ${colIndex + 1}`);
  });

  Logger.log("Finished processing all prompts in row 2.");
}