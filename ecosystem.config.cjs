module.exports = {
    apps: [{
        name: 'crossroad-app',
        script: './node_modules/vite/bin/vite.js',
        args: 'preview --port 3000 --host 0.0.0.0',
        interpreter: 'node',
        cwd: '/home/igib/crossroad/crossroadnew',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        error_file: '/home/igib/.pm2/logs/crossroad-error.log',
        out_file: '/home/igib/.pm2/logs/crossroad-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true
    }]
}
