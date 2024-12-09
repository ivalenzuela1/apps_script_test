// Environment URLs
const NEXT_PUBLIC_API_URL_DEV = 'https://devaisvcdev.westus2.cloudapp.azure.com/console/api';
const NEXT_PUBLIC_API_URL_PROD = 'http://44.233.199.50/console/api';
const NEXT_PUBLIC_APPS_URL_DEV = '/installed-apps/0aa4729a-838e-40a4-873b-674a31ff1c31';
const NEXT_PUBLIC_APPS_URL_PROD = '/installed-apps/73c0ae2e-b74a-47cd-9362-9c3120568789';

// Document endpoints
const DOC_URL_DEV = `${NEXT_PUBLIC_API_URL_DEV}${NEXT_PUBLIC_APPS_URL_DEV}`;
const DOC_URL_PROD = `${NEXT_PUBLIC_API_URL_PROD}${NEXT_PUBLIC_APPS_URL_PROD}`;

// SQL endpoints
const SQL_URL_DEV = `${NEXT_PUBLIC_API_URL_DEV}${NEXT_PUBLIC_APPS_URL_DEV}/tools/sql/gle`;
const SQL_URL_PROD = `${NEXT_PUBLIC_API_URL_PROD}${NEXT_PUBLIC_APPS_URL_PROD}/tools/sql/gle`;

// Agent endpoints
const AGENT_URL_DEV = `${NEXT_PUBLIC_API_URL_DEV}${NEXT_PUBLIC_APPS_URL_DEV}/tools/rest`;
const AGENT_URL_PROD = `${NEXT_PUBLIC_API_URL_PROD}${NEXT_PUBLIC_APPS_URL_PROD}/tools/rest`;

// Prompt Template endpoints
const PROMPT_URL_DEV = 'https://devaisvcdev.westus2.cloudapp.azure.com/agent-demo/v1/tools';
const PROMPT_URL_PROD = 'https://devaisvcdev.westus2.cloudapp.azure.com/agent-demo/v1/tools';
