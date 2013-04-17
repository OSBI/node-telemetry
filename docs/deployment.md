# Deployment

This guide will describe how to deploy telemetry to a Linux server with nohup and monit. 
We will use Debian in the examples below. Adjust the process for your distribution of choice.

Be sure you have installed Node.js 0.6 or later, as node-telemetry will not work 
with Node 0.4 and earlier. First, download the code to /opt/telemetry. Then create 
a script called /etc/init.d/telemetry marked as executable with the following contents:

	#!/bin/bash
	DIR=/opt/telemetry
	PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
	NODE_PATH=/usr/local/lib/node_modules
	NODE=/usr/local/bin/node
	
	test -x $NODE || exit 0
	
	function start_app {
	  NODE_ENV=production nohup "$NODE" "$DIR/server.js" 80 1>>"$DIR/telemetry.log" 2>&1 &
	  echo $! > "$DIR/telemetry.pid"
	  echo "Telemetry started"
	}
	
	function stop_app {
	  kill `cat $DIR/telemetry.pid` || echo "Could not stop process"
	}
	
	case $1 in
	    start)
	      start_app ;;
	    stop)
	      stop_app ;;
	    restart)
	      stop_app
	      start_app
	      ;;
	    *)
	      echo "usage: /etc/init.d/telemetry {start|stop|restart}" ;;
	esac
	exit 0

If you installed telemetry with npm, just alter the script to access the 
telemetry on path (`"$NODE" "$DIR/server.js"` would simply become `telemetry`). 
Then install monit:

	apt-get install monit

Alter /etc/monit/monitrc to make the following additions, which will ensure that 
telemetry is always running.

	set daemon  30
	set logfile syslog facility log_daemon 
	
	check process telemetry with pidfile "/opt/telemetry/telemetry.pid"
	  start program = "/etc/init.d/telemetry start"
	  stop program = "/etc/init.d/telemetry stop"
	  if failed url http://localhost/
	    with timeout 10 seconds
	    then restart

Also, ensure that monit is enabled by changing the startup variable in 
/etc/default/monit to 1. Then just start the monit daemon.

	/etc/init.d/monit start
	
That's it!