import sys

runs = []

for line in sys.stdin:
    if '..' in line:
        a, b = [int(x, 16) for x in line.strip().split('..')]
        runs.append([a, b - a + 1])
    else:
        a = int(line, 16)
        runs.append([a, 1])
print runs
