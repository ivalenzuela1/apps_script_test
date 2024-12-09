// Function to call the @doc API
function callDocApi(prompt, accessToken, env) {
  let baseUrl;

  // Select the correct base URL based on the environment
  if (env === "DEV") {
    baseUrl = DOC_URL_DEV;
  } else if (env === "PROD") {
    baseUrl = DOC_URL_PROD;
  } else {
    throw new Error(`Invalid environment: ${env}. Must be 'DEV' or 'PROD'.`);
  }

  console.log(`DEBUG: DOC Endpoint URL: ${baseUrl}`);

  try {
    const url = `${baseUrl}/chat-messages`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Accept: "text/event-stream"
    };
    const payload = JSON.stringify({
      response_mode: "streaming",
      conversation_id: "",
      query: prompt,
      inputs: {}
    });

    const response = UrlFetchApp.fetch(url, {
      method: "post",
      headers: headers,
      payload: payload
    });

    if (response.getResponseCode() === 401) {
      return "Error Code 401: AUTH";
    }

    if (response.getResponseCode() === 200) {
      return getAnswer(response.getContentText()); // Process the response content.
    }

    return "No answer. Please try again later.";
  } catch (e) {
    console.error(`Error callDocApi: ${e}`);
    return "Error. Please try again later.";
  }
}

// Function to process the streaming response and extract the answer
function getAnswer(responseContent) {
  let buffer = "";
  let answer = "";
  let retrieverResources = [];

  try {
    const lines = responseContent.split("\n");
    lines.forEach(line => {
      if (line.startsWith("data: ")) {
        const rawMessage = line.slice(6).trim();
        const [parsedMessage, error] = parseMessage(rawMessage);

        if (error) {
          return;
        }

        if (parsedMessage.event === "message_end") {
          retrieverResources = retrieverResources.concat(
            parsedMessage.metadata?.retriever_resources || []
          );
          return answer;
        } else if (parsedMessage.event === "message") {
          answer += parsedMessage.answer || "";
        }
      }
    });
  } catch (e) {
    console.error(`Error in stream processing: ${e}`);
  }

  return answer;
}

// Function to parse a raw message from the API
function parseMessage(rawMessage) {
  try {
    const parsedMessage = JSON.parse(rawMessage);
    return [parsedMessage, null];
  } catch (e) {
    console.error(`Error parsing message: ${e}`);
    return [null, e];
  }
}
