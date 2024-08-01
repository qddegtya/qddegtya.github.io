import { Octokit, App } from "octokit";
import { fetch as undiciFetch, ProxyAgent } from "undici";

let octokit;

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.log("No github token provided.");
  process.exit(1);
}

const proxyAgent = process.env.PROXY_AGENT;
if (proxyAgent) {
  octokit = new Octokit({
    auth: token,
    request: {
      fetch: (url, options) => {
        return undiciFetch(url, {
          ...options,
          dispatcher: new ProxyAgent({
            uri: proxyAgent,
          }),
        });
      },
    },
  });
} else {
  octokit = new Octokit({
    userAgent: "gp2p/client",
    auth: token,
  });
}

// open source project portfolio template
const PORTFOLIO_OSP = ({
  title,
  excerpt,
  teaser,
  projectName,
  projectHomepage,
  readmeContent,
}) => `
---
title: "${title}"
excerpt: "${excerpt}"
header:
  image: assets/images/p-header.jpg
  teaser: ${teaser}
sidebar:
  - title: "Name"
    text: "${projectName}"
  - title: "Type"
    text: "Open Source Project"
  - title: "Homepage"
    text: "${projectHomepage}"
  - title: "Status"
    text: "Released"
---

${readmeContent}
`;

const repos = await octokit.request("GET /user/repos", {
  headers: {
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

console.log(repos);
