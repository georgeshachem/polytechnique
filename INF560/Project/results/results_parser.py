import glob
from pathlib import Path
import re
import json

results = {}
for file in glob.glob('../ignored/*.txt'):
    file_name = Path(file).stem
    results[file_name] = {}

    with open(file) as f:
        data = f.readlines()
    for (i, line) in enumerate(data):
        if 'Running test on' in line:
            break
    data = data[i:]
    data = [data[x:x + 4] for x in range(0, len(data), 4)]

    for elt in data:
        input_file = re.search('images/original/(.*).gif',
                               elt[1]).group(1)
        sobel_time = re.search('SOBEL done in (.*) s', elt[2]).group(1)
        export_time = re.search('Export done in (.*) s',
                                elt[3]).group(1)

        results[file_name][input_file] = {'sobel_time': sobel_time,
                'export_time': export_time}

with open('results.json', 'w') as f:
    json.dump(results, f, indent=4, sort_keys=True)
