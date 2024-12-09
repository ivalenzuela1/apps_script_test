function updateTemplateAndRunTest() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();   
  const description = spreadsheet.getRangeByName('template').getValue();
  const templateName = spreadsheet.getRangeByName('templateName').getValue();
  const templateId = spreadsheet.getRangeByName('templateId').getValue();
  const env = spreadsheet.getRangeByName('env').getValue();
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
    `Are you sure you want to update **templateId ${templateId}** with **${templateName}** and run all tests?`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert("Operation cancelled.");
    return; // Exit if the user doesn't confirm
  }

  // Dynamically select the sheet based on the environment
  let sheet;
  let apiUrl;
  if (env === "DEV") {
    sheet = spreadsheet.getSheetByName("DEV results");
    apiUrl = PROMPT_URL_DEV;
  } else if (env === "PROD") {
    sheet = spreadsheet.getSheetByName("PROD results");
    apiUrl = PROMPT_URL_PROD;
  } else {
    throw new Error(`Invalid environment: ${env}. Expected 'DEV' or 'PROD'.`);
  }

  const token = spreadsheet.getRangeByName('token').getValue();

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    payload: JSON.stringify({ description }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(`${apiUrl}/${templateId}`, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      const response = ui.alert(
        `Success! The API call was successful and the prompt template ${templateId} has been updated with ${templateName}.`,
        ui.ButtonSet.OK
      );

      // Switch to the "prompt history" tab and scroll to the last row
      if (response === ui.Button.OK) {
        // Get all values in column B, excluding the header
        const columnBValues = sheet.getRange("B:B").getValues().flat().filter((value, index) => value && index > 0);

        // Determine the last non-empty row in column B
        const lastRow = (columnBValues.length > 0 ? columnBValues.length + 1 : 1) + 1; // Account for the header row

        const lastColumn = sheet.getLastColumn();
        spreadsheet.setActiveSheet(sheet);
        const lastRowRange = sheet.getRange(lastRow, 1, 1, lastColumn);
        lastRowRange.activate(); // Activates the entire last row

        // run tests
        const sheetName = sheet.getName();
        runTests(sheetName);
      }

    } else {
      Logger.log("error")
      // Show Error popup
      SpreadsheetApp.getUi().alert(`Error: API call failed with message: ${responseBody.message}`);
    }
  } catch (error) {
    // Show Error popup
    Logger.log("error")
    SpreadsheetApp.getUi().alert(`Error: API call failed. ${error.message}`);
  }
}

function updateTemplate() {

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const description = spreadsheet.getRangeByName('template').getValue();
  const templateName = spreadsheet.getRangeByName('templateName').getValue();
  const templateId = spreadsheet.getRangeByName('templateId').getValue();
  const env = spreadsheet.getRangeByName('env').getValue();
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
    `Are you sure you want to update **templateId ${templateId}** with **${templateName}**?`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert("Operation cancelled.");
    return; // Exit if the user doesn't confirm
  }

  // Dynamically define apiUrl
  let apiUrl;
  if (env === "DEV") {
    apiUrl = PROMPT_URL_DEV;
  } else if (env === "PROD") {
    apiUrl = PROMPT_URL_PROD;
  } else {
    throw new Error(`Invalid environment: ${env}. Expected 'DEV' or 'PROD'.`);
  }
  
  const token = spreadsheet.getRangeByName('token').getValue();

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    payload: JSON.stringify({ description }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(`${apiUrl}/${templateId}`, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      ui.alert(
        `Success! The API call was successful and the prompt template has been updated to ${templateName}.`,
        ui.ButtonSet.OK
      );
    } else {
      Logger.log("error")
      // Show Error popup
      SpreadsheetApp.getUi().alert(`Error: API call failed with message: ${responseBody.message}`);
    }
  } catch (error) {
    // Show Error popup
    Logger.log("error")
    SpreadsheetApp.getUi().alert(`Error: API call failed. ${error.message}`);
  }
}


function getPromptTemplates() {

  const ui = SpreadsheetApp.getUi();
  const tokenValidator = validateToken();
  if (!tokenValidator) {
    ui.alert(
      `Access Token has expired. Please update.`,
      ui.ButtonSet.OK
    );
    return;
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const allTemplateSheet = spreadsheet.getSheetByName("all templates");
  const env = spreadsheet.getRangeByName('env').getValue();

  // Dynamically define apiUrl
  let apiUrl;
  if (env === "DEV") {
    apiUrl = PROMPT_URL_DEV;
  } else if (env === "PROD") {
    apiUrl = PROMPT_URL_PROD;
  } else {
    throw new Error(`Invalid environment: ${env}. Expected 'DEV' or 'PROD'.`);
  }

  // clear content
  allTemplateSheet.getRange(4, 1, 200, allTemplateSheet.getLastColumn()).clearContent();
  
  const token = spreadsheet.getRangeByName('token').getValue();

  const options = {
    method: "get",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseContent = response.getContent();
    const data = JSON.parse(response.getContentText());
    const result = data.result;

    Logger.log(result);

    if (responseCode === 200) {

       // Prepare data for output
      const outputData = result.map(item => [item.id, item.name, item.toolkit, item.description]);

      // Write data to the sheet starting from row 4
      if (outputData.length > 0) {
        allTemplateSheet.getRange(4, 1, outputData.length, 4).setValues(outputData);
      }

      allTemplateSheet.setRowHeightsForced(4,20,130);
  /*    ui.alert(
        `Success! The API call was successful and the prompt template has been updated to ${templateName}.`,
        ui.ButtonSet.OK
      );
      */
    } else {
      Logger.log("error")
      // Show Error popup
      SpreadsheetApp.getUi().alert(`Error: API call failed with message: ${responseBody.message}`);
    }
  } catch (error) {
    // Show Error popup
    Logger.log("error")
    SpreadsheetApp.getUi().alert(`Error: API call failed. ${error.message}`);
  }
}


