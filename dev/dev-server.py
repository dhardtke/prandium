#!/usr/bin/python3

"""
Example demonstrating how to simultaneously read from multiple subprocesses (Python 2, 3)
Author: Nicholas Folse
Original Solution By: jfs https://stackoverflow.com/users/4279/jfs
Date:   2020.03.21
Problem:
- How do I simultaneously process output from multiple subprocesses using Python?
- Can I read from multiple subprocesses in parallel using Python?
Possible Solutions:
- Create a thread for each subprocess, then gather results. This solution
  would require complex synchronization of any shared data structures.
- Use asyncio. This solution would require Python 3.6+ and introduces the
  complexity of using asyncio, which seems like overkill for this problem
- Use selectors. Selectors (Linux only) provide a mechanism to listen for
  events on multiple file descriptors with a timeout.
Best Solution (cross platform): Threads
adapted from: https://stackoverflow.com/questions/375427/non-blocking-read-on-a-subprocess-pipe-in-python
This solution is based on threads. The basic idea is to read from each process
in a separate thread and write the answers into a queue.
The example below depends on a file "foo.txt" that contains:
Line 1
Line 2
Line 3
Line 4
Output from the process should look something like the following:
('slowAwk1: a', 'line 1\n')
('slowAwk2: b', 'line 1\n')
('cat: c', 'line 1\n')
('cat: c', 'line 2\n')
('cat: c', 'line 3\n')
('cat: c', 'line 4')
('slowAwk2: b', 'line 2\n')
('slowAwk1: a', 'line 2\n')
('slowAwk2: b', 'line 3\n')
('slowAwk1: a', 'line 3\n')
('slowAwk2: b', 'line 4\n')
('slowAwk1: a', 'line 4\n')
[('slowAwk1', 0), ('slowAwk2', 0), ('cat', 0)]
This shows that output of multiple subprocesses can be read using multiple threads.
"""
import os
import sys
from collections import deque
from subprocess import PIPE, Popen, STDOUT
from threading import Thread
from time import sleep

os.chdir(os.path.dirname(os.path.abspath(sys.argv[0])))
os.chdir("..")


def handle_processes(processes, timeout=0.1):
    def enqueue_output(handler, out, queue):
        for line in out:
            queue.append((handler, line))
        queue.append((handler, None))

    q = deque()

    threads = [Thread(target=enqueue_output, args=(proc[1], proc[0].stdout, q)) for id, proc in processes.items()]
    for thread in threads:
        thread.daemon = True  # thread dies with the program
        thread.start()

    # read line without blocking
    while None in (p[0].poll() for p in processes.values()) or len(q) > 0:
        try:
            while len(q) > 0:
                handler, line = q.popleft()
                handler(line)
        except IndexError:
            sleep(timeout)


def main():
    def create_popen(args):
        on_posix = 'posix' in sys.builtin_module_names
        return Popen(args, stdout=PIPE, stderr=STDOUT, close_fds=on_posix, shell=False)

    def tagged_printer(tag):
        def handler(line):
            if line:
                decoded = line.decode('utf-8').strip()
                if decoded:
                    print("[%15s] %s" % (tag, decoded))

        return handler

    COMMANDS: dict[str, list[str]] = {
        "SASS": ["sass.cmd", "--watch", "src/assets/index.scss", "dist/index.css"],
        "JS": ["deno", "bundle", "--watch", "--unstable", "src/assets/index.ts", "dist/index.js"],
        "Server": ["deno", "run", "--watch", "--unstable", "--allow-read", "--allow-write", "--allow-net", "src/main.ts"]
    }
    processes = {}
    for label in COMMANDS:
        processes[label] = (create_popen(COMMANDS[label]), tagged_printer(label))

    handle_processes(processes)
    print([(id, proc[0].returncode) for id, proc in processes.items()])


if __name__ == "__main__":
    main()
