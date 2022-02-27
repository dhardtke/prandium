# SELinux
## `prandium.te`:
```text
module prandium 1.0;

require {
    type init_t;
    type http_port_t;
    type httpd_sys_content_t;
    type user_home_t;
    class file { create execute execute_no_trans map open read setattr write };
    class process execmem;
    class tcp_socket name_connect;
}

#============= init_t ==============

allow init_t http_port_t:tcp_socket name_connect;
allow init_t httpd_sys_content_t:file { create open setattr write };
allow init_t self:process execmem;
allow init_t user_home_t:file { execute execute_no_trans map open read };
```
Install by executing
```shell
checkmodule -M -m -o prandium.mod prandium.te
semodule_package -o prandium.pp -m prandium.mod
semodule -i prandium.pp
```

(This is the result of executing e.g.
```shell
audit2allow -M prandium << _EOF_
type=AVC msg=audit(1616334281.833:2075): avc:  denied  { execute } for  pid=11871 comm="(deno)" name="deno" dev="dm-1" ino=654320288 scontext=system_u:system_r:init_t:s0 tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file permissive=0
type=AVC msg=audit(1616334850.629:2079): avc:  denied  { read open } for  pid=11926 comm="(deno)" path="/home/prandium/.deno/bin/deno" dev="dm-1" ino=654320288 scontext=system_u:system_r:init_t:s0 tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file permissive=0
type=AVC msg=audit(1616334918.697:2083): avc:  denied  { execute_no_trans } for  pid=11960 comm="(deno)" path="/home/prandium/.deno/bin/deno" dev="dm-1" ino=654320288 scontext=system_u:system_r:init_t:s0 tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file permissive=0
type=AVC msg=audit(1616335218.868:2087): avc:  denied  { map } for  pid=11996 comm="deno" path="/home/prandium/.deno/bin/deno" dev="dm-1" ino=654320288 scontext=system_u:system_r:init_t:s0 tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file permissive=0
type=AVC msg=audit(1616335278.409:2092): avc:  denied  { execmem } for  pid=12041 comm="deno" scontext=system_u:system_r:init_t:s0 tcontext=system_u:system_r:init_t:s0 tclass=process permissive=0
type=AVC msg=audit(1616337025.899:2720): avc:  denied  { name_connect } for  pid=12536 comm="deno" dest=443 scontext=system_u:system_r:init_t:s0 tcontext=system_u:object_r:http_port_t:s0 tclass=tcp_socket permissive=0
type=AVC msg=audit(1616337111.010:2726): avc:  denied  { create } for  pid=12536 comm="tokio-runtime-w" name="haehnchengeschnetzeltes.jpg-1.jpg" scontext=system_u:system_r:init_t:s0 tcontext=system_u:object_r:httpd_sys_content_t:s0 tclass=file permissive=0
type=AVC msg=audit(1616337423.744:2732): avc:  denied  { write open } for  pid=12536 comm="tokio-runtime-w" path="/home/prandium/.config/prandium/thumbnails/haehnchengeschnetzeltes.jpg-3.jpg" dev="dm-1" ino=1384120849 scontext=system_u:system_r:init_t:s0 tcontext=system_u:object_r:httpd_sys_content_t:s0 tclass=file permissive=0
type=AVC msg=audit(1616337423.744:2732): avc:  denied  { setattr } for  pid=50379 comm="tokio-runtime-w" name="auflauf.jpg" dev="dm-1" ino=125832134 scontext=system_u:system_r:init_t:s0 tcontext=system_u:object_r:httpd_sys_content_t:s0 tclass=file permissive=0
_EOF_
```
with the error messages from `/var/log/audit/audit.log`)

## Set context and flags
```shell
CONFIG_DIR="/home/prandium/.config/prandium"
INSTALL_DIR="/home/prandium/repository"

semanage fcontext -a -t httpd_sys_content_t "$CONFIG_DIR/thumbnails(/.*)?"
restorecon -Rv $CONFIG_DIR/thumbnails

semanage fcontext -a -t httpd_sys_content_t "$INSTALL_DIR/assets/(dist|favicons|icons\.svg|placeholder\.svg)(/.*)?"
restorecon -Rv $INSTALL_DIR/assets/dist $INSTALL_DIR/assets/favicons $INSTALL_DIR/assets/icons.svg $INSTALL_DIR/assets/placeholder.svg
```

# systemd
*/lib/systemd/system/prandium.service*
```text
Description=Prandium
After=network.target

[Service]
Type=simple
User=prandium
WorkingDirectory=/home/prandium
ExecStart=/home/prandium/.deno/bin/deno run --no-check --allow-net --allow-env --lock=/home/prandium/repository/lock.json --allow-read=/home/prandium/.config/prandium,/home/prandium/repository,/tmp --allow-write=/home/prandium/.config/prandium,/tmp --unstable /home/prandium/repository/src/main.ts
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

# nginx
```text
server {
    listen 443 http2 ssl;
    listen [::]:443 http2 ssl;
    server_name prandium.example.org;

    auth_basic           Authentication;
    auth_basic_user_file /etc/nginx/htpasswd/prandium.example.org;

    ssl_certificate /etc/ssl/letsencrypt/prandium.example.org/fullchain.pem;
    ssl_certificate_key /etc/ssl/letsencrypt/prandium.example.org/privkey.pem;
    ssl_trusted_certificate /etc/ssl/letsencrypt/prandium.example.org/chain.pem;

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
        alias /home/prandium/repository/assets;
    }
    location /sw.js {
        alias /home/prandium/repository/assets/sw.js;
    }
    location /thumbnails {
        alias /home/prandium/.config/prandium/thumbnails;
    }
    location /favicon.ico {
        alias /home/prandium/repository/assets/favicons;
    }
}
```
