/** PM2 ecosystem — Linux production (processo único princy-ai-editor). */
const root = __dirname;

module.exports = {
  apps: [
    {
      name: "princy-ai-editor",
      cwd: root,
      script: "/usr/bin/bash",
      args: ["-c", "exec npm run start"],
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0"
      },
      autorestart: true,
      max_restarts: 20,
      min_uptime: "10s",
      merge_logs: true
    }
  ]
};
