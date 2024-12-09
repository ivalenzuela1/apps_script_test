function execute() {
  const ui = SpreadsheetApp.getUi();

  const tokenValidator = validateToken();
  if (!tokenValidator) {
    ui.alert(
      `Access Token has expired. Please update.`,
      ui.ButtonSet.OK
    );
    return;
  }

  // Show a confirmation dialog with YES and NO buttons
  const response = ui.alert(
    "Confirmation",
    `Are you sure you want to run all tests without updating the templates?`,
    ui.ButtonSet.YES_NO
  );

  // check token expiration

  if (response !== ui.Button.YES) {
    ui.alert("Operation cancelled.");
    return; // Exit if the user doesn't confirm
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const env = spreadsheet.getRangeByName('env').getValue();

  let sheetName;
  let sheet;
  if (env === "DEV") {
    sheetName = "DEV results";
    sheet = spreadsheet.getSheetByName("DEV results");
  } else if (env === "PROD") {
    sheetName = "PROD results";
    sheet = spreadsheet.getSheetByName("PROD results");
  } else {
    throw new Error(`Invalid environment: ${env}. Expected 'DEV' or 'PROD'.`);
  }

  // Select last row
  // Get all values in column B, excluding the header
  const columnBValues = sheet.getRange("B:B").getValues().flat().filter((value, index) => value && index > 0);

  // Determine the last non-empty row in column B
  const lastRow = (columnBValues.length > 0 ? columnBValues.length + 1 : 1) + 1; // Account for the header row

  const lastColumn = sheet.getLastColumn();
  spreadsheet.setActiveSheet(sheet);
  const lastRowRange = sheet.getRange(lastRow, 1, 1, lastColumn);
  lastRowRange.activate(); // Activates the entire last row

  runTests(sheetName);
}

function runTests(sheetName) {
  // Initialize the Google Sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  const token = spreadsheet.getRangeByName('token').getValue();
  const templateName = spreadsheet.getRangeByName('templateName').getValue();
  const env = spreadsheet.getRangeByName('env').getValue();
  const userEmail = Session.getActiveUser().getEmail();

  if (!sheet) {
    console.error(`ERROR: Sheet with name '${sheetName}' not found.`);
    return;
  }

  // Get all values in row 2 (prompts)
  const row2 = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  console.log("DEBUG: Row 2 values:", row2);

  // Find the last row in column B
  const colBValues = sheet.getRange(1, 2, sheet.getLastRow(), 1).getValues().flat();
  const lastNonEmptyRowInColB = colBValues.reverse().findIndex(value => value && value.toString().trim() !== "") + 1;
  const lastRowIndex = lastNonEmptyRowInColB === 0 ? 2 : colBValues.length - lastNonEmptyRowInColB + 2;
  console.log(`DEBUG: Last row in column B is ${lastRowIndex}`);

  // Iterate through row 2 starting from the second cell (B2, C2, ...)
  for (let colIndex = 2; colIndex <= row2.length; colIndex++) {
    const prompt = row2[colIndex - 1]; // Adjust for zero-based indexing
    if (prompt && prompt.trim()) { // Check if the cell has text
      console.log(`DEBUG: Processing column ${colIndex} with prompt: ${prompt}`);

      // Call the API with the prompt
      let answer = '';
      try {
        if (prompt.includes("@doc")) {
          console.log("DEBUG: Detected '@doc' in prompt, calling callDocApi.");
          const sanitizedPrompt = prompt.replace("@doc", "").trim();
          answer = callDocApi(sanitizedPrompt, token, env);

        } else if (prompt.includes("@sql")) {
          console.log("DEBUG: Detected '@sql' in prompt, calling callSqlApi.");
          const sanitizedPrompt = prompt.replace("@sql", "").trim();
          answer = callSqlApi(sanitizedPrompt, token, env);

        } else {
          console.log("DEBUG: No '@doc' or '@sql' detected, calling callAgentApi.");
          answer = callAgentApi(prompt, token, env);
        }

        console.log(`DEBUG: Received answer for column ${colIndex}: ${answer}`);
      } catch (e) {
        console.error(`ERROR: Failed to process column ${colIndex}: ${e.message}`);
        continue;
      }

      sheet.getRange(lastRowIndex, colIndex).setValue(answer);
      SpreadsheetApp.flush(); // Force immediate update

      // Write the answer to the last cell in the column
      sheet.setRowHeightsForced(4, lastRowIndex, 130);
      SpreadsheetApp.flush(); // Force immediate update
      console.log(`DEBUG: Cleared formatting and set row height for row ${lastRowIndex}`);

      // Add "SUCCESS" with a timestamp to the cell below
      const timestamp = new Date();
      const successMessage = `SUCCESS - ${templateName} - ${timestamp.toISOString()} - ${userEmail}`;
      sheet.getRange(lastRowIndex + 1, colIndex).setValue(successMessage);
      SpreadsheetApp.flush(); // Force immediate update
      console.log(`DEBUG: 'SUCCESS' written to cell (${lastRowIndex + 1}, ${colIndex})`);
    }
  }

  console.log("DEBUG: Finished processing all prompts in row 2.");
}

function checkToken() {
  const ui = SpreadsheetApp.getUi();
  const isTokenValid = validateToken();

  if (isTokenValid) {
    //Show success popup and switch tabs on "OK"
    ui.alert(
      `Access Token Validated!`,
      ui.ButtonSet.OK
    );

  } else {
    ui.alert(
      `Access Token has expired. Please update.`,
      ui.ButtonSet.OK
    );
  }
}


function validateToken() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const token = spreadsheet.getRangeByName('token').getValue();
  const env = spreadsheet.getRangeByName('env').getValue();
  const prompt = 'test'
  let baseUrl;

  if (env === "DEV") {
    baseUrl = AGENT_URL_DEV;
  } else if (env === "PROD") {
    baseUrl = AGENT_URL_PROD;
  } else {
    throw new Error(`Invalid environment: ${env}. Must be 'DEV' or 'PROD'.`);
  }


  const options = {
    method: "get",
    headers: {
      Authorization: `Bearer ${token}`
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(`${baseUrl}/servicenow?q=${prompt}&p=google`, options);
    const statusCode = response.getResponseCode();

    if (statusCode == 200) {
      return true;
    } else {
      return false;

    }
  } catch (e) {
    return false;
  }
}


function loginToTechBuddy() {
  var url = "https://devaisvcdev.westus2.cloudapp.azure.com/console/api/installed-apps/0aa4729a-838e-40a4-873b-674a31ff1c31";

  var payload = {
    email: "ignacio23232@dev-ai.com", // Replace with your email
    password: "devai1232323232" // Replace with your password
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var jsonResponse = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200) {
      Logger.log("Login successful!");
      Logger.log("Response: " + JSON.stringify(jsonResponse));
      return jsonResponse;
    } else {
      Logger.log("Login failed. Status: " + response.getResponseCode());
      Logger.log("Response: " + response.getContentText());
    }
  } catch (e) {
    Logger.log("Error occurred during login: " + e.message);
  }
}

