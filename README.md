# Remote EDITor

Edit remote files with TextMate, Sublime Text 2, Chocolat and more!

## Requirements

**Server:** nodejs

**Client:** bash, cURL

## Installation

### On your home machine

```shell
# Install
$ npm -g install redit

# Run the daemon
$ redit-server --editor "mate -w" --background
```

### On the remote machine

```shell
# Connect with the forwarded port
$ ssh remote.host.com -R 32123:localhost:32123

# Get the client script
$ curl localhost:32123 > ./redit.sh; chmod u+x ./redit.sh

# Test it out
$ ./redit.sh testfile.txt

# Your editor should open. Type something. Save and close your editor

# Check out the edited file
$ cat testfile.txt
```

## Usage

There are two parts to redit: the server and the client.
Both will work out of the box with the defaults if TextMate is installed. For other editors such as Sublime Text 2 and Chocolat, be sure to set the editor option on the server.

### Server

The server will pick an editor based on a heirarchy of variables (in order of precidence):

1. `--editor` command line argument
2. `REDIT_EDITOR` environment variable
3. `EDITOR` environment variable
4. hard coded `mate -w` default

For security reasons, the server will listen on the local interface by default.
If you would like to listen on all interfaces, set the `--ip` option or `REDIT_IP` environment variable to `0.0.0.0`.

The port can be changed via the `--port` argument or `REDIT_PORT` environment variable.

```
Usage: redit-server [--editor 'EDITOR'] [--ip INTERFACE] [--port PORT] [-b]

Options:
  -e, --editor      Local editor to spawn (don't forget -w)  [default: "mate -w"]
  --ip              Interface to listen on                   [default: "127.0.0.1"]
  --port            Port for server to listen on             [default: 32123]
  -b, --background  Run server as a daemon (background)      [boolean]
  -h, --help        Show this help message                   [boolean]
```

### Client

Environment variables:

`REDIT_HOST` server hostname to connect to

`REDIT_PORT` server port to connect to

```
Usage: ./redit.sh [-H hostname] [-p port] [-f] file-path

 -H  connect to host (default: localhost)
 -p  port number to use for connection (default: 32123)
 -f  open even if file is not writable
 -h  display this usage information
```


## Tips

You can edit your ssh config (~/.ssh/config) to setup remote forwarding to every host you connect to:

```
Host *
    RemoteForward 32123 localhost:32123
Host github.com
    ClearAllForwardings yes
```

## Infrequently Asked Questions

### Why Javascript?

Because I wanted to use HTTP as the protocol and node makes it easy. I'm also a little bit obsessed with Javascript.

### Ok smart ass, why HTTP then?

I'm lazy and didn't want to impliment my own protocol, so I thought it would be easier. This way the client could just be cURL.

### WTF is the extra "X" that gets appended to the response?

Setting bash variables strips trailing new lines. This makes sure they don't get stripped. Don't worry though, because the client script removes it before saving.

### Then why the hell didn't you just have cURL save the file?

cURL doesn't save empty responses (even with a status of 200). So if you zero out a file with your editor, cURL won't save your change.

### Couldn't you do it this way instead?

[You could, couldn't you...](https://help.github.com/articles/fork-a-repo)

## Disclaimer

I've kinda tested this, so feel free to try it, but don't come crying to me if you wipe out your server configs. 
Also, I have no idea what will happen if you try to edit binary files. Open an issue if you want to bitch.

## License

[WTFPL](http://en.wikipedia.org/wiki/WTFPL)