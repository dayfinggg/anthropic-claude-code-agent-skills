---
name: server-ops
description: Running PHP sites on Linux servers over SSH, covering rollouts of one change to several hosts, nginx and PHP-FPM configuration and reloads, OPcache after a deploy, Cloudflare caching and purges, Memcached, and cron jobs or systemd timers. Use when deploying or rolling back code with ssh, git pull, rsync or a symlink switch, editing or testing nginx or php-fpm config, reloading these services, when a deployed change does not show up, when purging Cloudflare or reading cf-cache-status, on 502, 504 or 520 to 526 errors, "Primary script unknown", "File not found." or "nginx: [emerg]", when restoring visitor IPs behind Cloudflare, flushing or inspecting Memcached, adding or debugging a crontab, an /etc/cron.d file or a timer, or reading nginx, php-fpm or journal logs after a change.
---

## Read first

Go through these steps before you act on this skill. Do each step whose condition fits the task, and read each such file in full with the Read tool. When you cannot tell whether a step fits, do it. When the work later reaches a step you skipped, do it then.

1. Read `references/cloudflare.md` when changing cache rules or cache headers, purging, reading `cf-cache-status`, restricting the origin to Cloudflare, or debugging 520 to 526 errors.
2. Fetch https://nginx.org/en/download.html (Current nginx mainline and stable) with `curl -sL` or WebFetch when the task depends on that version or rule, and follow the page where it is newer than this skill.
3. Fetch https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6 (Cloudflare address ranges) with `curl -sL` when writing `set_real_ip_from` lines or firewall rules for Cloudflare.
4. Fetch https://www.php.net/supported-versions.php (PHP release lines and support dates) with `curl -sL` or WebFetch when choosing, upgrading or reporting a PHP-FPM version.

## Check first

- On each host, read what runs before you write config: `nginx -v`, `nginx -V 2>&1 | grep -o realip`, `ls /etc/php/` with `systemctl list-units 'php*-fpm*'`, the pool that serves the site (`grep -rn '^listen' /etc/php/*/fpm/pool.d/`), the server block (`nginx -T 2>/dev/null | grep -n server_name`) and `dpkg -l cron cronie`.
- Distribution packages lag upstream: Debian 13 ships nginx 1.26.3, Debian 12 1.22.1, Ubuntu 24.04 1.24.0 and Ubuntu 22.04 1.18.0. `http2 on;` needs 1.25.1 and `add_header_inherit` needs 1.29.3, so both fail `nginx -t` on these hosts.
- List what the pre-production and production copies of a site share before a write: database, cache directory, Memcached instance, error log and cron jobs.
- Latest releases on 2026-11-15: nginx mainline 1.31.8 and stable 1.30.6, PHP 8.5 (8.6 in release candidates, 8.2 security support ends 2026-12-31), Memcached 1.6.45, OpenSSH 10.6p2, rsync 3.5.2.
- Facts verified 2026-11.

## Defaults

- Run scripted SSH with `ssh -o BatchMode=yes -o ConnectTimeout=10 -o ServerAliveInterval=15 -o ControlMaster=auto -o ControlPath=~/.ssh/cm-%C -o ControlPersist=60 host cmd`. `BatchMode` turns a password prompt or an unknown host key into an error instead of a hang, `ConnectTimeout` covers only the connection and handshake, and the control socket reuses one connection per host. Quoting of remote commands is in concise:shell.
- Roll one change out host by host in one loop iteration each: pre-production step, its check, production step, its check. Stop the loop at the first failed check, and test the exit status of every `ssh` call.
- Switch a release by building it in a new directory and replacing the `current` symlink: `ln -sfn` is atomic on GNU coreutils 8.27 and later (temporary link plus rename), and `ln -s NEW current.tmp && mv -T current.tmp current` is atomic everywhere. Without `-n` or `-T` the new link lands inside the old release directory. BusyBox `ln -f` deletes the link first.
- Test before every reload, then read the log: `nginx -t && systemctl reload nginx`, then `tail -n 50 /var/log/nginx/error.log` and the vhost logs that `nginx -T | grep -E 'access_log|error_log'` names. On Debian and Ubuntu, `systemctl reload nginx` runs `nginx -s reload` without a test, and a config that fails at reload leaves the old one running while the command exits 0. Old workers keep serving open connections until they finish.
- With a `current` symlink, set `fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;` and `fastcgi_param DOCUMENT_ROOT $realpath_root;` so PHP sees the release path. Debian's `fastcgi.conf` sets `SCRIPT_FILENAME` and `fastcgi_params` does not, so including only `fastcgi_params` gives "Primary script unknown" and "File not found.".
- Check that the script exists in the PHP location (`try_files $uri =404;` or Debian's `snippets/fastcgi-php.conf`). Without it, any path ending in `.php`, uploads included, reaches PHP-FPM.
- `fastcgi_cache_key` has no default. Put `$scheme$host$request_uri` in it, and bypass the cache for logged-in cookies and POST with `fastcgi_cache_bypass` plus `fastcgi_no_cache`.
- Behind Cloudflare, restore the visitor address with `real_ip_header CF-Connecting-IP;` and one `set_real_ip_from` line per range, generated from the two official lists. Write the file only after both downloads succeeded, since an empty file trusts no proxy and every visitor then has a Cloudflare address. In PHP read `REMOTE_ADDR`, because `$_SERVER['HTTP_CF_CONNECTING_IP']` skips the trusted-proxy check.
- Test and reload PHP-FPM the same way: `php-fpm8.4 -t && systemctl reload php8.4-fpm`. The Debian unit reloads with `kill -USR2` and no test. Pools live in `/etc/php/<version>/fpm/pool.d/` and the master log in `/var/log/php<version>-fpm.log`. Worker stdout and stderr go to `/dev/null` unless the pool sets `catch_workers_output = yes` or `php_admin_value[error_log]`.
- After a deploy, OPcache with the defaults `validate_timestamps=1` and `revalidate_freq=2` picks up changed files one by one within about 2 seconds, so a release of many files mixes old and new code for a moment. With `validate_timestamps=0` nothing changes until PHP-FPM reloads or `opcache_reset()` runs inside a request that PHP-FPM serves.
- Settings that `php_admin_value` sets cannot be changed by `ini_set()`, while `php_value` settings can. INI_SYSTEM settings such as `opcache.memory_consumption` belong in `php.ini`: from PHP 8.5 setting one in a pool logs a warning.
- Clear one site's Memcached data by changing a version or prefix in that site's keys or by deleting known keys. Read the instance with `printf 'stats\r\nquit\r\n' | nc 127.0.0.1 11211` and `stats items`, and list keys with `lru_crawler metadump all`, which does not lock the cache.
- In crontab lines write `%` as `\%`, because cron turns `%` into a newline and sends the rest to the command's stdin. Lines in `/etc/crontab` and `/etc/cron.d/*` have a user field after the five time fields, user crontabs (`crontab -e`) do not.
- Cron sets only `SHELL`, `LOGNAME`, `HOME` and reads `MAILTO`. Set `PATH` in the file or use absolute paths, since files in `/etc/cron.d` do not inherit the `PATH` of `/etc/crontab`.
- Wrap a job that can outlast its interval in `flock -n /run/lock/<job>.lock <command>`. A held lock exits 1 like many failing jobs do, so add `-E <code>` when the two must differ. A systemd timer never starts a second copy of a running service, and `Persistent=true` with `OnCalendar=` catches up runs missed while the host was off.

## Gotchas

- `flush_all` empties the whole Memcached instance, every site and every session stored in it. Its delay argument only postpones that.
- `php -r 'opcache_reset();'` runs in the CLI, whose OPcache is off by default (`opcache.enable_cli=0`), and leaves PHP-FPM's cache untouched.
- `realpath_cache_ttl` is 120 seconds per worker, so a symlink switch without `$realpath_root` or a PHP-FPM reload can serve the old release for up to two minutes.
- Debian's and Ubuntu's default `cron` package ignores `CRON_TZ` without an error (cronie supports it). Use a systemd timer with a time zone in `OnCalendar=`, or schedule in the system time zone.
- Debian cron ignores files in `/etc/cron.d` whose names contain a dot, such as `site.cron`, and files that are not owned by root or are group- or world-writable.
- One `add_header` in a `location` drops every `add_header` inherited from `server` and `http`. On 1.29.3 and later `add_header_inherit merge;` keeps them. Headers reach error responses only with `always`.
- `try_files` is not inherited into the implicit location that `if` creates inside a `location`. Build conditional values with `map` and keep `if` to `return`, `rewrite` and `set`.
- Debian's `fastcgi_params` sets `HTTP_HOST` to `$host` since nginx 1.26.3-3+deb13u4, which drops the port the client sent. A CMS that builds absolute URLs from it behaves differently on hosts with older packages.
- `rsync --link-dest=PREV` hard-links unchanged files into the new release, so editing such a file in place also changes the previous release. `--delay-updates` only narrows the window of an in-place sync and is not atomic.
- OpenSSH 10.1 broke sessions with `ControlPersist` (fixed in 10.2), prints a `WarnWeakCrypto` warning on stderr when the host negotiates a key exchange that is not post-quantum, and since 10.0 `scp` and `sftp` no longer start a master connection themselves.
- Cloudflare answers 524 when the origin sends no response within 125 seconds, even if PHP-FPM finishes later. Run long jobs from the CLI or cron, not in a web request.
