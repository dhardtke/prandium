# SELinux
## `cook-guide.te`:
```text
module cook-guide 1.0;

require {
    type user_home_t;
    type init_t;
    class file { execute execute_no_trans map open read };
    class process execmem;
}

#============= init_t ==============
allow init_t self:process execmem;

#!!!! This avc is allowed in the current policy
allow init_t user_home_t:file { execute execute_no_trans map open read };
```
(This is the result of executing e.g. ```
audit2allow -M cook-guide << _EOF_
type=AVC msg=audit(1616334281.833:2075): avc:  denied  { execute } for  pid=11871 comm="(deno)" name="deno" dev="dm-1" ino=654320288 scontext=system_u:system_r:init_t:s0 tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file permissive=0
type=AVC msg=audit(1616334850.629:2079): avc:  denied  { read open } for  pid=11926 comm="(deno)" path="/home/cook-guide/.deno/bin/deno" dev="dm-1" ino=654320288 scontext=system_u:system_r:init_t:s0 tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file permissive=0
type=AVC msg=audit(1616334918.697:2083): avc:  denied  { execute_no_trans } for  pid=11960 comm="(deno)" path="/home/cook-guide/.deno/bin/deno" dev="dm-1" ino=654320288 scontext=system_u:system_r:init_t:s0 tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file permissive=0
type=AVC msg=audit(1616335218.868:2087): avc:  denied  { map } for  pid=11996 comm="deno" path="/home/cook-guide/.deno/bin/deno" dev="dm-1" ino=654320288 scontext=system_u:system_r:init_t:s0 tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file permissive=0
type=AVC msg=audit(1616335278.409:2092): avc:  denied  { execmem } for  pid=12041 comm="deno" scontext=system_u:system_r:init_t:s0 tcontext=system_u:system_r:init_t:s0 tclass=process permissive=0
_EOF_``` with the error messages from `/var/log/audit/audit.log`)

## nginx
```text
CONFIG_DIR="/home/cook-guide/.config/cook-guide"
INSTALL_DIR="/home/cook-guide/repository"

semanage fcontext -a -t httpd_sys_content_t "$CONFIG_DIR/thumbnails(/.*)?"
restorecon -Rv $CONFIG_DIR/thumbnails

semanage fcontext -a -t httpd_sys_content_t "$INSTALL_DIR/assets/(dist|favicons)(/.*)?"
restorecon -Rv $INSTALL_DIR/assets/dist $INSTALL_DIR/assets/favicons
```

# systemd
*/lib/systemd/system/cook-guide.service*
```text
  GNU nano 5.3                                                                                                              /lib/systemd/system/cook-guide.service                                                                                                              Modified  [Unit]
Description=CookGuide
After=network.target

[Service]
Type=simple
User=cook-guide
WorkingDirectory=/home/cook-guide
ExecStart=/home/cook-guide/.deno/bin/deno run --no-check --allow-all --unstable /home/cook-guide/repository/src/main.ts
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

# nginx
```
server {
    listen 443 http2 ssl;
    listen [::]:443 http2 ssl;
    server_name cook-guide.example.org;

    auth_basic           Authentication;
    auth_basic_user_file /etc/nginx/htpasswd/cookguide.example.org;

    ssl_certificate /etc/ssl/letsencrypt/cook-guide.example.org/fullchain.pem;
    ssl_certificate_key /etc/ssl/letsencrypt/cook-guide.example.org/privkey.pem;
    ssl_trusted_certificate /etc/ssl/letsencrypt/cook-guide.example.org/chain.pem;

    location / {
        proxy_set_header        Host $host;
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header        X-Forwarded-Proto $scheme;

        proxy_pass              http://127.0.0.1:8000/;
        proxy_read_timeout      600s;
        proxy_send_timeout      600s;
    }

    location /assets {
        alias /home/cook-guide/repository/assets;
    }
    location /thumbnails {
        alias /home/cook-guide/.config/cook-guide/thumbnails;
    }
}```
