#!/bin/sh
### BEGIN INIT INFO
# Provides:
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: ...
# Description:       ...
### END INIT INFO

name=smtp2swu
pid_file="/var/run/$name.pid"
logfile="/var/log/$name.log"

user="nobody"
working_dir="/usr/lib/node_modules/smtp2swu"
cmd="node server.js"

### Unless the service requires some additional finagling, nothing should be
### edited below this line

get_pid() {
    cat "$pid_file"
}

is_running() {
    [ -f "$pid_file" ] && ps `get_pid` > /dev/null 2>&1
}

case "$1" in
    start)
        if is_running; then
            echo "Already started"
        else
            echo "Starting $name"
            cd "$working_dir"
            $cmd &

            echo $! > "$pid_file"

            if ! is_running; then
                echo "Unable to start, see $logfile"
                exit 1
            else
                echo "Started"
            fi
        fi;;
    stop)
        if ! is_running; then
            echo "Not running"
        else
            echo -n "Stopping $name..."

            kill `get_pid`

            # wait up to 10 seconds for process to stop
            for i in {1..10}; do
                if ! is_running; then
                    break
                fi

                echo -n "."
                sleep 1
            done
            echo

            if is_running; then
                echo "Not stopped; shutdown may be slow or may have failed"
                exit 1
            else
                echo "Stopped"
                [ -f "$pid_file" ] && rm "$pid_file"
            fi
        fi;;
    restart)
        $0 stop
        if is_running; then
            echo "Unable to stop, will not attempt to start"
            exit 1
        fi
        $0 start;;
    status)
        if is_running; then
            echo "Running"
        else
            echo "Stopped"
            exit 1
        fi;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1;;
esac

exit 0
